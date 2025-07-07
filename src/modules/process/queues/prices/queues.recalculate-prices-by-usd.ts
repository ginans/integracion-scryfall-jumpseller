import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { StagingProductVariantService } from 'src/modules/staging-product-variant/staging-product-variant.service';
import { UsdPricesService } from 'src/modules/prices/usd-prices/usd-prices.service';
import { RecalculatePricesByUsdDto } from '../../dto/recalculate-prices-by-usd.dto';
import { IStagingProductVariant } from 'src/modules/staging-product-variant/interfaces/stagingProductVariant.interface';
import { IUsdPrice } from 'src/modules/prices/usd-prices/interfaces/usd-prices.interface';

@Injectable()
export class QueuesRecalculatePricesByUsd {
  private readonly logger = new Logger('QueuesRecalculatePricesByUsd', {
    timestamp: true,
  });

  private isProcessing = false; // 🔒 Simple mutex

  constructor(
    private readonly variantService: StagingProductVariantService,
    private readonly usdPricesService: UsdPricesService,
    @InjectQueue('recalculate-prices-by-usd')
    private readonly QueuesRecalculatePricesByUsd: Queue,
  ) {}

  //recalcular precios al cambiar el precio del dolar
  async recalculatePricesByUsd(newUsdPrice: IUsdPrice) {
   
    // 🔒 MUTEX: Si ya está procesando, esperar a que termine
    if (this.isProcessing) {
      this.logger.log('⏳ Another recalculation is in progress, waiting...');
      // Esperar hasta que termine el proceso anterior
      while (this.isProcessing) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    this.isProcessing = true; // 🔒 Lockear

    try {
      try {
        await this.QueuesRecalculatePricesByUsd.obliterate({ force: true });
        this.logger.log('✅ Queue obliterated successfully');
      } catch (error) {
        this.logger.warn(
          `Obliterate failed, trying clean instead: ${error.message}`,
        );
        // Fallback a clean si obliterate falla
        await Promise.all([
          this.QueuesRecalculatePricesByUsd.clean(0, 0, 'wait'),
          this.QueuesRecalculatePricesByUsd.clean(0, 0, 'active'),
          this.QueuesRecalculatePricesByUsd.clean(0, 0, 'delayed'),
        ]);
      }

      //obtengo los variantes
      const obtainedVariants = await this.variantService.obtainVariantforPrices(
        undefined,
        undefined,
        newUsdPrice.game,
        undefined,
      );

      // Encolar nuevos jobs con timestamp para identificación
      const timestamp = Date.now();

      //las proceso una a una para que se actualicen los precios
      for (const variant of obtainedVariants) {
        await this.QueuesRecalculatePricesByUsd.add(
          'recalculate-prices-by-usd',
          {
            ...variant,
            game: newUsdPrice.game,
            newUsdPrice: newUsdPrice.usdPrice,
          },
          {
            // Usar ID único que incluya el precio USD para mejor identificación
            jobId: `recalc-${variant._id}-usd${newUsdPrice.usdPrice}-${timestamp}`,
          },
        );
      }
    } catch (error) {
      this.logger.error(`Error in recalculatePricesByUsd: ${error.message}`);
      throw error;
    } finally {
      this.isProcessing = false; 
    }
  }
}
