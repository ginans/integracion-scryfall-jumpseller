import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';
import { ScryfallCardResponse } from 'src/modules/magic/submodules/scryfall/interfaces/scryfall.interface';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { ILangUrlEnum } from 'src/modules/magic/submodules/scryfall/enums/lang.enum';


@Processor('2-save-magic-cards', { concurrency: 80 })
export class SaveMagicCardsProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('3-create-product-request') private readonly createProductJumpsellerQueue: Queue<{ enCard: MagicCardDocument, esCard?: MagicCardDocument | null, thereIsSpanishVersion: boolean }, string, string>,
  ) { super() }
  async process(job: Job<{ card: ScryfallCardResponse }, string, string>): Promise<any> {
    let thereIsSpanishVersion = false
     const versionES = await this.magicCardsService.getCardInOtherLang(ILangUrlEnum.ES, job.data.card.oracle_id, job.data.card.collector_number, job.data.card.set);
    try {
      await job.updateProgress(25);
      //crea en base de datos
      await this.magicCardsService.createMagicCards(job.data.card);
      const cardInDB = await this.magicCardsService.findCardByScryfallId(job.data.card.id);
      let newEsCard = null
      if (job.data.card && versionES) {
        //crear la versión en español si existe
        newEsCard = await this.magicCardsService.createMagicCards(versionES);
        if (newEsCard) {
          thereIsSpanishVersion = true
        }
      }
      await job.updateProgress(50);
      // Enviar a la cola de creación de productos en Jumpseller
      await this.createProductJumpsellerQueue.add(
        `DB product: ${cardInDB.id}`,//nombre del job
        { enCard: cardInDB, esCard: newEsCard, thereIsSpanishVersion },//datos del job
        { jobId: String(cardInDB.id) } //identificador único del job
      );
      await job.updateProgress(100);
      return {
        enCardId: cardInDB.id,
        spanishVersion: thereIsSpanishVersion,
      }
    } catch (error) {
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}