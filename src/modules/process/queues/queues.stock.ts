import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StagingProductVariantService } from 'src/modules/products/staging-product-variant/staging-product-variant.service';

@Processor('queues-stock')
export class QueuesStock extends WorkerHost {
  private readonly logger = new Logger(QueuesStock.name, {
    timestamp: true,
  });
  constructor(
    private readonly stageingProductVariantService: StagingProductVariantService,
  ) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    try {
      await job.updateProgress(25);
      await this.stageingProductVariantService.saveStockFromFront(job.data);
      await job.updateProgress(50);
      await this.stageingProductVariantService.sendStockToJumpseller(job.data);
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
    console.log(`Queue stock completada u agotada`);
  }
}