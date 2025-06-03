import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StagingProductVariantService } from 'src/modules/staging-product-variant/staging-product-variant.service';
import { IdsJumpseller } from '../../interfaces/api-prices.interface';
import { IStagingProductVariant } from 'src/modules/staging-product-variant/interfaces/stagingProductVariant.interface';

@Processor('queues-api-prices')
export class QueuesApiPrices extends WorkerHost {
  private readonly logger = new Logger(QueuesApiPrices.name, {
    timestamp: true,
  });
  constructor(
    private readonly variantService: StagingProductVariantService,
  ) {
    super();
  }
  async process(job: Job<IStagingProductVariant, any, string>): Promise<any> {
    try {
      await job.updateProgress(25);
      await this.variantService.calculatePricesByVariant(job.data);
      await job.updateProgress(100);
      return 'done';
    } catch (error) {
      await job.moveToFailed(new Error(error.message), "true");
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
    console.log(`Queue prices completada u agotada`);
  }
}