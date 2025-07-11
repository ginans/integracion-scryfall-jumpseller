import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StagingProductVariantService } from 'src/modules/staging-product-variant/staging-product-variant.service';
import { UsdPricesService } from 'src/modules/prices/usd-prices/usd-prices.service';

@Processor('recalculate-prices-by-usd')
export class RecalculatePricesByUsdProcessor extends WorkerHost {
  private readonly logger = new Logger('recalculate-prices-by-usd', {
    timestamp: true,
  });
  constructor(
    private readonly stagingProductVariantService: StagingProductVariantService,
    private readonly usdPricesService: UsdPricesService,
  ) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    try {

      // Calcular precios del dolar por variante
      await job.updateProgress(25);

      await this.stagingProductVariantService.calculatePricesByVariant(
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
