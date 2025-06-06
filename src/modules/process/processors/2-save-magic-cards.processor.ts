import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';
import { ScryfallCardResponse } from 'src/modules/magic/submodules/scryfall/interfaces/scryfall.interface';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';


@Processor('2-save-magic-cards', { concurrency: 20 })
export class SaveMagicCardsProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService:MagicCardsService,
    @InjectQueue('3-create-product-jumpseller') private readonly createProductJumpsellerQueue: Queue<MagicCardDocument, string, string>,
    ) { super() }
  async process(job: Job<{card: ScryfallCardResponse}, string, string>): Promise<any> {
    try {
      await job.updateProgress(25);
      //crea en base de datos
      const newCard = await this.magicCardsService.createMagicCards(job.data.card);
      await job.updateProgress(50);
      // Enviar a la cola de creación de productos en Jumpseller
      await this.createProductJumpsellerQueue.add(`DB product: ${newCard._id}`, newCard, { jobId: newCard._id.toString() });
      await job.updateProgress(100);
      return newCard._id;
    } catch (error) {
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}