import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { VariantsService } from 'src/modules/variants/variants.service';

@Processor('recalculate-prices-by-usd')
export class RecalculatePricesByUsdProcessor extends WorkerHost {
  private readonly logger = new Logger('recalculate-prices-by-usd', {
    timestamp: true,
  });
  constructor(
    private readonly variantService: VariantsService,
  ) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    try {
      // Calcular precios del dolar por variante
      await job.updateProgress(25);

      await this.variantService.calculatePricesByVariant(
        job.data,
      );

      await job.updateProgress(100);
      return 'done';
    } catch (error) {
      this.logger.error(
        `Error processing variant ${job.data._id}: ${error.message}`,
      );
      await job.moveToFailed(new Error(error.message), 'true');
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
