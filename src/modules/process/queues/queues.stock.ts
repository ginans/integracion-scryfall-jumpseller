import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { VariantsService } from 'src/modules/variants/variants.service';

@Processor('queues-stock')
export class QueuesStock extends WorkerHost {
  private readonly logger = new Logger(QueuesStock.name, {
    timestamp: true,
  });
  constructor(
    private readonly variantsService: VariantsService,
  ) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    try {
      await job.updateProgress(25);
      await this.variantsService.saveStockFromFront(job.data);
      await job.updateProgress(50);
      await this.variantsService.sendStockToJumpseller(job.data);
      await job.updateProgress(100);
      return 'done';
    } catch (error) {
      await job.moveToFailed(new Error(error.message), 'true');
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
