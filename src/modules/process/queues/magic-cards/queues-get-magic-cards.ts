import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';
import { IenumURLLang } from 'src/modules/magic/submodules/scryfall/enums/lang.enum';
import { ScryfallCardResponse } from 'src/modules/magic/submodules/scryfall/interfaces/scryfall.interface';


@Processor('queues-get-magic-cards')
export class QueuesGetMagicCards extends WorkerHost {
  private readonly logger = new Logger(QueuesGetMagicCards.name, {
    timestamp: true,
  });
  constructor(
    private readonly magicCardsService:MagicCardsService
  ) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    try {
      const data = job.data as ScryfallCardResponse;
      const lg  = job.name as IenumURLLang
      await job.updateProgress(25);
      this.logger.log(`procesando ${data.name} en languaje ${lg}`);
      //guardar la carta en la base de datos
      await this.magicCardsService.createMagicCards(data);
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