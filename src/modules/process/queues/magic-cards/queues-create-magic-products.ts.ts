import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';
import { IenumURLLang } from 'src/modules/magic/submodules/scryfall/enums/lang.enum';
import { ScryfallCardResponse } from 'src/modules/magic/submodules/scryfall/interfaces/scryfall.interface';
import { ProcessService } from '../../process.service';
import { QueuesGetMagicCards } from './queues-get-magic-cards';


@Processor('queues-create-magic-products')
export class QueuesCreateMagicProducts extends WorkerHost {
  private readonly logger = new Logger(QueuesCreateMagicProducts.name, {
    timestamp: true,
  });
  constructor(
    private readonly magicCardsService:MagicCardsService,
    private readonly ProcessService: ProcessService
  ) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    try {
      //procesar cartas en pares de variante exacta, asociar por set, collectorNumber y oracleId
      const data = job.data as ScryfallCardResponse;
      const lg  = job.name as IenumURLLang
      await job.updateProgress(25);
      const getMagicCards = this.ProcessService.initCardMagic()
      await job.updateProgress(50);
      
      this.logger.log(`process ${data.name}`)
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