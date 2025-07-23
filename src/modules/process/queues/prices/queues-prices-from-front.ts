import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StagingProductVariantService } from 'src/modules/variants/variants.service';

@Processor('update-prices-from-front')
export class QueuesPricesFromFront extends WorkerHost {
  private readonly logger = new Logger('update-prices-from-front', {
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
      await this.stageingProductVariantService.savePricesFromFront(job.data);
      await job.updateProgress(50);
      await this.stageingProductVariantService.sendPriceToJumpseller(job.data);
      await job.updateProgress(100);
      return 'done';
    } catch (error) {
      await job.moveToFailed(new Error(error.message), 'true');
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
