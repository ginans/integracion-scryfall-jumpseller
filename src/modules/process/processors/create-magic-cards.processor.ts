import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';
import { ScryfallCardResponse } from 'src/modules/magic/submodules/scryfall/interfaces/scryfall.interface';


@Processor('create-magic-cards', { concurrency: 20 })
export class CreateMagicCardsProcessor extends WorkerHost {
  private readonly logger = new Logger(CreateMagicCardsProcessor.name, { timestamp: true });
  constructor(private readonly magicCardsService:MagicCardsService) {
    super();
  }
  async process(job: Job<{card: ScryfallCardResponse}, string, string>): Promise<any> {
    try {
      await job.updateProgress(25);
      await this.magicCardsService.createMagicCards(job.data.card);
      await job.updateProgress(100);
      return job.data.card.id;
    } catch (error) {
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}