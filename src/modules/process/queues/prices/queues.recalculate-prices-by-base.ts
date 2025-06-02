import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StagingProductVariantService } from 'src/modules/staging-product-variant/staging-product-variant.service';
import { BasePricesService } from '../../../prices/base-prices/base-prices.service';
import { UsdPricesService } from 'src/modules/prices/usd-prices/usd-prices.service';
import { IUsdPrice } from 'src/modules/prices/usd-prices/interfaces/usd-prices.interface';
import { IBasePrice, IBasePrices, IBasePriceUpdate } from 'src/modules/prices/base-prices/interface/base-prices.interface';
import { EnumGame } from 'src/common/enums/game.enum';
import { string } from 'joi';
import { IStagingProductVariant } from 'src/modules/staging-product-variant/interfaces/stagingProductVariant.interface';



@Processor("queues-recalculate-prices-by-base")
export class QueuesRecalculatePricesByBase extends WorkerHost {
  private readonly logger = new Logger("queues-recalculate-prices-by-base", {
    timestamp: true,
  });
  constructor(
    private readonly stageingProductVariantService: StagingProductVariantService,
    private readonly basePricesService: BasePricesService,
  ) {
    super();
  }
  async process(job: Job<IStagingProductVariant, any , string>): Promise<any> {

    //TODO: manejar casos para etched
    let rarityFoil
    if (job.data.rarity === "common" && job.data.finish === "nonfoil") {
      rarityFoil = "commonC";
    }else if(job.data.rarity === "common" && job.data.finish === "foil") {
      rarityFoil = "commonC-Foil";
    } else if (job.data.rarity === "uncommon" && job.data.finish === "nonfoil") {
      rarityFoil = "uncommonU";
    } else if (job.data.rarity === "uncommon" && job.data.finish === "foil") {
      rarityFoil = "uncommonU-Foil";
    }else if (job.data.rarity === "rare" && job.data.finish === "nonfoil") {
      rarityFoil = "rareR";
    }else if (job.data.rarity === "rare" && job.data.finish === "foil") {
      rarityFoil = "rareR-Foil";
    }else if (job.data.rarity === "mythic" && job.data.finish === "nonfoil") {
      rarityFoil = "mythicM";
    }else if (job.data.rarity === "mythic" && job.data.finish === "foil") {
      rarityFoil = "mythicM-Foil";
    } else{
      rarityFoil = `${job.data.rarity}, ${job.data.finish}`;
    }
      
    try {
      await job.updateProgress(25);
      await this.stageingProductVariantService.calculatePricesByVariant(
         job.data,
         rarityFoil 
       )
       await job.updateProgress(100);
    
    
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