import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';
import { ScryfallCardResponse } from 'src/modules/magic/submodules/scryfall/interfaces/scryfall.interface';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';

@Processor('2-save-magic-cards', {
  concurrency: 120,
})
export class SaveMagicCardsProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('3-create-product-request')
    private readonly createProductJumpsellerQueue: Queue<
      {
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
        thereIsSpanishVersion: boolean;
      },
      string,
      string
    >,
  ) {
    super();
  }
  async process(
    job: Job<
      { card: ScryfallCardResponse; spanishCard?: ScryfallCardResponse | null },
      string,
      string
    >,
  ): Promise<any> {
    const { card, spanishCard } = job.data;
    let thereIsSpanishVersion = false;

    try {
      await job.updateProgress(25);
      //crea en base de datos
      const cardInDB = await this.magicCardsService.createMagicCards(
        job.data.card,
      );
      // const cardInDB = await this.magicCardsService.findCardByScryfallId(
      //   card.id,
      // );
      if (!cardInDB) {
        throw new Error('Card not found in database after creation');
      }
      if (cardInDB.idJumpSeller) {
        // La carta ya existe en Jumpseller, cancelamos el proceso de manera natural
        //TODO: crear nuevo proceso para actualizacion
        await job.updateProgress(100);
        return {
          enCardId: cardInDB.id,
          spanishVersion: false,
          skipped: true,
          reason: `Esta carta ya esta creada como producto en jumpseller: ${cardInDB.idJumpSeller}`,
        };
      }
      await job.updateProgress(40);
      // Si la carta existe en español, crea la versión en español
      let newEsCard = null;
      if (card && spanishCard) {
        //crear la versión en español si existe
        newEsCard = await this.magicCardsService.createMagicCards(spanishCard);
        if (newEsCard) {
          thereIsSpanishVersion = true;
        }
      }
      await job.updateProgress(50);
      // Enviar a la cola de creación de productos en Jumpseller

      //--------------------------------------------------------------------------------------

      // RETURN TEMPORAL PARA PRUEBAS - NO CREAR PRODUCTOS AÚN
      // return {
      //   enCardId: cardInDB.id,
      //   spanishVersion: thereIsSpanishVersion,
      //   testing: true,
      //   message: "Proceso detenido para pruebas - no se crearon productos"
      // };

      //-------------------------------------------------------------------------------------
      await this.createProductJumpsellerQueue.add(
        `DB product: ${cardInDB.id}`, //nombre del job
        { enCard: cardInDB, esCard: newEsCard, thereIsSpanishVersion }, //datos del job
        { jobId: String(cardInDB.id) }, //identificador único del job
      );
      await job.updateProgress(100);
      return {
        enCardId: cardInDB.id,
        spanishVersion: thereIsSpanishVersion,
      };
    } catch (error) {
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
