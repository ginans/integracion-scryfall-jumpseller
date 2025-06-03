import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';
import { IEnumLangUrl } from 'src/modules/magic/submodules/scryfall/enums/lang.enum';
import { ScryfallCardResponse } from 'src/modules/magic/submodules/scryfall/interfaces/scryfall.interface';


@Processor('create-magic-cards')
export class CreateMagicCardsProcessor extends WorkerHost {
  private readonly logger = new Logger(CreateMagicCardsProcessor.name, { timestamp: true });
  constructor(private readonly magicCardsService:MagicCardsService) {
    super();
  }
  async process(job: Job<{lg: IEnumLangUrl, card: ScryfallCardResponse}, any, string>): Promise<any> {
    try {
      await job.updateProgress(25);
      await this.magicCardsService.createMagicCards(job.data.card);
      // Validar si existe
      const existingCard = await this.magicCardsService.findByScryfallId(data.id);
      await job.updateProgress(100);
      return 'done';
    } catch (error) {
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<any, any, string>) {
    console.log(`Job completed with result ${job.returnvalue}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any, any, string>) {
    console.log(`Job failed with reason ${job.failedReason}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<any, any, string>) {
    console.log(`Job progress updated to ${job.progress}`);
  }

  @OnWorkerEvent('paused')
  onPaused(job: Job<any, any, string>) {
    console.log(`Job paused`);
  }

  @OnWorkerEvent('resumed')
  onResumed(job: Job<any, any, string>) {
    console.log(`Job resumed`);
  }

  @OnWorkerEvent('drained')
  onDrained() {
    console.log(`Queue magic-cards completada u agotada`);
  }
}