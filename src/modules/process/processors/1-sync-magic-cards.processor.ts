import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { ScryfallService } from '../../magic/submodules/scryfall/scryfall.service';
import { ILangUrlEnum } from '../../magic/submodules/scryfall/enums/lang.enum';
import { ScryfallCardResponse } from '../../magic/submodules/scryfall/interfaces/scryfall.interface';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { IresponseSryfall } from '../../magic/submodules/scryfall/interfaces/scryfall.interface';
import { MagicCardsService } from '../../magic/magic-cards.service';

@Processor('1-sync-magic-cards')
export class SyncMagicCardsProcessor extends WorkerHost {
  constructor(
    private readonly scryfallService: ScryfallService,
    private readonly redisCacheService: RedisCacheService,
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('2-save-magic-cards')
    private readonly SaveMagicCards: Queue<
      { card: ScryfallCardResponse; spanishCard?: ScryfallCardResponse | null },
      string,
      string
    >,
  ) {
    super();
  }
  async process(
    job: Job<{ lang: ILangUrlEnum }, { count: number }, string>,
  ): Promise<number> {
    const lg: ILangUrlEnum = job.data.lang;
    let count: number = 0;
    let cacheHits = 0;
    let cacheMisses = 0;
    let spanishCacheHits = 0;
    let spanishCacheMisses = 0;

    try {
      await job.updateProgress(50);
      let page = 1;
      let process = true;
      do {
        // Generar clave de cache única para esta página y idioma
        const cacheKey = `scryfall:${lg}:page:${page}`;

        // Intentar obtener datos desde cache primero
        let data = await this.redisCacheService.get<IresponseSryfall>(cacheKey);
        let usedCache = false;

        if (data) {
          usedCache = true;
          cacheHits++;
        } else {
          cacheMisses++;
          data = await this.scryfallService.getScryfallCards(lg, page);

          // Guardar en cache por 24 horas (como recomienda Scryfall)
          if (data) {
            await this.redisCacheService.set(cacheKey, data, 24 * 60 * 60); // 24 horas en segundos
          }
        }

        // Validar que data existe y tiene la estructura esperada
        if (!data) {
          console.error(
            `❌ No se recibieron datos de Scryfall para página ${page}`,
          );
          throw new Error(
            `No se recibieron datos de Scryfall para página ${page}`,
          );
        }

        if (!data.data || !Array.isArray(data.data)) {
          console.error(
            `❌ Estructura de datos inválida de Scryfall para página ${page}:`,
            data,
          );
          throw new Error(
            `Estructura de datos inválida de Scryfall para página ${page}`,
          );
        }

        if (data.data.length === 0) {
          console.log(`⚠️ Página ${page} está vacía, terminando procesamiento`);
          break;
        }

        /**
         * Para probar el flujo de solo 1 card, descomentar la siguiente línea
         * await this.SaveMagicCards.add(`Card:${data[0].id}`, { card: data[0] },{jobId: data[0].id, })
         */

        // Procesar cada carta y consultar su versión en español
        const cardJobPromises = data.data.map(async (card) => {
          // Generar clave de cache para versión en español
          const spanishCacheKey = `spanish:${card.oracle_id}:${card.collector_number}:${card.set}`;

          // Intentar obtener versión española desde cache
          let spanishCard =
            await this.redisCacheService.get<ScryfallCardResponse | null>(
              spanishCacheKey,
            );

          if (spanishCard !== null) {
            spanishCacheHits++;
          } else {
            spanishCacheMisses++;

            // Delay más corto entre consultas (estamos centralizando todo aquí)
            await new Promise((resolve) => setTimeout(resolve, 150));

            try {
              spanishCard = await this.magicCardsService.getCardInOtherLang(
                ILangUrlEnum.ES,
                card.oracle_id,
                card.collector_number,
                card.set,
              );
            } catch (error) {
              console.warn(
                `⚠️ Error consultando versión española para ${card.name}: ${error.message}`,
              );
              spanishCard = null; // Continuar con null si hay error
            }

            // Guardar en cache por 24 horas (incluye null si no existe versión española)
            await this.redisCacheService.set(
              spanishCacheKey,
              spanishCard,
              24 * 60 * 60,
            );
          }

          // Agregar el job con ambas cartas (inglés + español si existe)
          return this.SaveMagicCards.add(
            `Card:${card.id}`,
            { card, spanishCard },
            { jobId: card.id, priority: 1 },
          );
        });

        await Promise.all(cardJobPromises);
        count += data.data.length;

        // Log de progreso cada 100 cartas procesadas
        if (count % 100 === 0 || count <= 100) {
          const spanishTotal = spanishCacheHits + spanishCacheMisses;
          const spanishHitRate =
            spanishTotal > 0
              ? ((spanishCacheHits / spanishTotal) * 100).toFixed(1)
              : 0;
          console.log(
            `📊 Página ${page} (${data.data.length} cartas) | Total: ${count} | Cache ES: ${spanishCacheHits}H/${spanishCacheMisses}M (${spanishHitRate}%)`,
          );
        }

        process = data.has_more;
        /**
         * Para probar el flujo de solo 1 página, descomentar la siguiente línea;
         */
        if (page == 20) process = false;
        page++;
        // Solo aplicar delay si consultamos Scryfall (no desde cache)
        if (!usedCache) {
          // Delay conservador de 1 segundo para evitar soft-ban
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      } while (process);

      // Estadísticas finales de cache
      const pageHitRate =
        cacheHits > 0
          ? ((cacheHits / (cacheHits + cacheMisses)) * 100).toFixed(1)
          : 0;
      const spanishHitRate =
        spanishCacheHits > 0
          ? (
              (spanishCacheHits / (spanishCacheHits + spanishCacheMisses)) *
              100
            ).toFixed(1)
          : 0;

      console.log(`🧐 Resumen Final (${lg}) - Total: ${count} cartas`);
      console.log(
        `   📄 Páginas: ${cacheHits}H/${cacheMisses}M (${pageHitRate}%) | 🇪🇸 Español: ${spanishCacheHits}H/${spanishCacheMisses}M (${spanishHitRate}%)`,
      );

      await job.updateProgress(100);
      return count;
    } catch (error) {
      console.error('❌ Error en sync-magic-cards:', error);

      // Manejar específicamente el error 429 (Too Many Requests)
      if (error.message.includes('429')) {
        throw new Error(
          `Rate limit excedido de Scryfall. Espera antes de reintentar: ${error.message}`,
        );
      }

      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
