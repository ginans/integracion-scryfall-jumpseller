import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { ScryfallService } from '../../magic/submodules/scryfall/scryfall.service';
import { ILangUrlEnum } from '../../magic/submodules/scryfall/enums/lang.enum';
import { ScryfallCardResponse } from '../../magic/submodules/scryfall/interfaces/scryfall.interface';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { IresponseSryfall } from '../../magic/submodules/scryfall/interfaces/scryfall.interface';
import { MagicCardsService } from '../../magic/magic-cards.service';

@Processor('1-sync-magic-cards', {
  concurrency: 5, // Limitar a 5 jobs a la vez para evitar problemas
  limiter: {
    max: 8,
    duration: 1000,
  },
})
export class SyncMagicCardsProcessor extends WorkerHost {
  constructor(
    private readonly scryfallService: ScryfallService,
    private readonly redisCacheService: RedisCacheService,
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('1-sync-magic-cards')
    private readonly syncMagicCardsQueue: Queue<
      | { lang: ILangUrlEnum; newPage?: number }
      | {
          lang: ILangUrlEnum;
          spanishCardRequest: {
            oracle_id: string;
            collector_number: string;
            set: string;
            cardData?: ScryfallCardResponse;
          };
        },
      { count: number },
      string
    >,
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
    job: Job<
      {
        lang: ILangUrlEnum;
        newPage?: number;
        spanishCardRequest?: {
          oracle_id: string;
          collector_number: string;
          set: string;
          cardData?: ScryfallCardResponse;
        };
      },
      { count: number },
      string
    >,
  ): Promise<number> {
    const lg: ILangUrlEnum = job.data.lang;
    // Si el job es para una carta individual (español)
    if (job.data.spanishCardRequest) {
      const { oracle_id, collector_number, set, cardData } =
        job.data.spanishCardRequest;
      const spanishCacheKey = `spanish:${oracle_id}:${collector_number}:${set}`;
      let spanishCard =
        await this.redisCacheService.get<ScryfallCardResponse | null>(
          spanishCacheKey,
        );
      if (spanishCard === null) {
        try {
          spanishCard = await this.magicCardsService.getCardInOtherLang(
            ILangUrlEnum.ES,
            oracle_id,
            collector_number,
            set,
          );
        } catch (error) {
          console.warn(
            `⚠️ Error consultando versión española para oracle_id=${oracle_id}: ${error.message}`,
          );
          spanishCard = null;
        }
        await this.redisCacheService.set(
          spanishCacheKey,
          spanishCard,
          24 * 60 * 60,
        );
      }
      // Guardar la carta (cardData es la carta en inglés)
      if (cardData) {
        await this.SaveMagicCards.add(
          `Card:${cardData.id}`,
          { card: cardData, spanishCard: spanishCard },
          { jobId: cardData.id, priority: 1 },
        );
      }
      return 1;
    }

    // Si el job es para una página
    const page: number = job.data.newPage || 1;
    let cacheHits = 0;
    let cacheMisses = 0;
    let spanishCacheHits = 0;
    let spanishCacheMisses = 0;

    try {
      await job.updateProgress(50);
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
        if (data) {
          // Guardar en cache por 24 horas
          await this.redisCacheService.set(cacheKey, data, 24 * 60 * 60);
        }
      }

      // Validar que data existe y tiene la estructura esperada
      if (!data || !data.data || !Array.isArray(data.data)) {
        throw new Error(
          `No se recibieron datos válidos de Scryfall para página ${page}`,
        );
      }

      if (data.data.length === 0) {
        console.log(`⚠️ Página ${page} está vacía, terminando procesamiento`);
        return 0;
      }

      // Por cada carta, agrega un job para consultar la versión en español
      const cardJobPromises = data.data.map(async (card) => {
        const spanishCacheKey = `spanish:${card.oracle_id}:${card.collector_number}:${card.set}`;
        let spanishCard =
          await this.redisCacheService.get<ScryfallCardResponse | null>(
            spanishCacheKey,
          );
        if (spanishCard !== null) {
          spanishCacheHits++;
          // Guardar la carta directamente (inglés + español ya en caché)
          console.log(
            `[JOB] Guardada carta EN | id: ${card.id} | oracle_id: ${card.oracle_id} | set: ${card.set} | collector: ${card.collector_number}`,
          );
          return this.SaveMagicCards.add(
            `Card:${card.id}`,
            { card: card, spanishCard: spanishCard },
            { jobId: card.id, priority: 1 },
          );
        } else {
          spanishCacheMisses++;
          // Agregar job para procesar la carta en español (pasa la carta en inglés para guardar después)
          return this.syncMagicCardsQueue.add(
            '1-sync-magic-cards',
            {
              lang: ILangUrlEnum.ES,
              spanishCardRequest: {
                oracle_id: card.oracle_id,
                collector_number: card.collector_number,
                set: card.set,
                cardData: card,
              },
            },
            { jobId: `es-card-${card.id}` },
          );
        }
      });

      await Promise.all(cardJobPromises);
      const count = data.data.length;
      const spanishTotal = spanishCacheHits + spanishCacheMisses;
      const spanishHitRate =
        spanishTotal > 0
          ? ((spanishCacheHits / spanishTotal) * 100).toFixed(1)
          : 0;
      console.log(
        `[JOB] Tipo: ${job.data.spanishCardRequest ? 'CARTA_ES' : 'PAGINA'} | jobId: ${job.id} | lang: ${lg} | Página: ${page} | Cartas: ${count} | Cache ES: ${spanishCacheHits}H/${spanishCacheMisses}M (${spanishHitRate}%)`,
      );

      // Si hay más páginas, auto-agrega el siguiente job
      if (data.has_more === true) {
        await this.syncMagicCardsQueue.add(
          '1-sync-magic-cards',
          { lang: lg, newPage: page + 1 },
          { jobId: `page-${lg}-${page + 1}` },
        );
      }

      await job.updateProgress(100);
      return count;
    } catch (error) {
      console.error('❌ Error en sync-magic-cards:', error);
      if (error.message.includes('429')) {
        throw new Error(
          `Rate limit excedido de Scryfall. Espera antes de reintentar: ${error.message}`,
        );
      }
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
