import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StagingProductVariantService } from 'src/modules/staging-product-variant/staging-product-variant.service';
import { UsdPricesService } from 'src/modules/prices/usd-prices/usd-prices.service';
import { IStagingProductVariant } from 'src/modules/staging-product-variant/interfaces/stagingProductVariant.interface';

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
      const { _id, name, recalcTimestamp, game, newUsdPrice } = job.data;

      this.logger.log(
        `Processing variant ${_id} (${name}) for game ${game} - USD: $${newUsdPrice} - timestamp: ${recalcTimestamp}`,
      );

      // Calcular precios del dolar por variante
      await job.updateProgress(25);

      // ✅ Para USD no necesitamos rareza, solo la variante
      await this.stagingProductVariantService.calculatePricesByVariant(
        job.data,
      );

      await job.updateProgress(100);

      this.logger.log(
        `Successfully processed variant ${_id} with USD $${newUsdPrice}`,
      );
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
