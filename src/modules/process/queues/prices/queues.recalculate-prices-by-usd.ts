import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StagingProductVariantService } from 'src/modules/staging-product-variant/staging-product-variant.service';
import { BasePricesService } from '../../../prices/base-prices/base-prices.service';
import { UsdPricesService } from 'src/modules/prices/usd-prices/usd-prices.service';
import { IStagingProductVariant } from 'src/modules/staging-product-variant/interfaces/stagingProductVariant.interface';




@Processor("queues-recalculate-prices-by-usd")
export class QueuesRecalculatePricesByUds extends WorkerHost {
  private readonly logger = new Logger("queues-recalculate-prices-by-usd", {
    timestamp: true,
  });
  constructor(
    private readonly stageingProductVariantService: StagingProductVariantService,
    private readonly usdPricesService: UsdPricesService,
  ) {
    super();
  }
  async process(job: Job<any, IStagingProductVariant, string>): Promise<any> {
    try {
      //calcular precios del dolar por variante
     await job.updateProgress(25);
     await this.stageingProductVariantService.calculatePricesByVariant(
        job.data
     )
      await job.updateProgress(100);
  
    } catch (error) {
      await job.moveToFailed(new Error(error.message), "true");
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}