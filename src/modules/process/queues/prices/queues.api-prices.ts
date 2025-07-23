import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StagingProductVariantService } from 'src/modules/variants/variants.service';
import { IdsJumpseller } from '../../interfaces/api-prices.interface';
import { IStagingProductVariant } from 'src/modules/variants/interfaces/variants.interface';

@Processor('queues-api-prices')
export class QueuesApiPrices extends WorkerHost {
  private readonly logger = new Logger(QueuesApiPrices.name, {
    timestamp: true,
  });
  constructor(private readonly variantService: StagingProductVariantService) {
    super();
  }
  async process(job: Job<IStagingProductVariant, any, string>): Promise<any> {
    try {
      await job.updateProgress(25);
      await this.variantService.calculatePricesByVariant(job.data);
      await job.updateProgress(100);
      return 'done';
    } catch (error) {
      await job.moveToFailed(new Error(error.message), 'true');
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
