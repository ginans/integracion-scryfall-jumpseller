import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { StagingProductVariantService } from 'src/modules/staging-product-variant/staging-product-variant.service';
import { BasePricesService } from '../../../prices/base-prices/base-prices.service';
import { UsdPricesService } from 'src/modules/prices/usd-prices/usd-prices.service';
import { IRecalculatePrices } from '../../interfaces/recalculate-prices.interface';
import { IUsdPrice } from 'src/modules/prices/usd-prices/interfaces/usd-prices.interface';
import { IBasePrice, IBasePrices, IBasePriceUpdate } from 'src/modules/prices/base-prices/interface/base-prices.interface';
import { EnumGame } from 'src/common/enums/game.enum';
import { string } from 'joi';



@Processor(QueuesRecalculatePrices.name)
export class QueuesRecalculatePrices extends WorkerHost {
  private readonly logger = new Logger(QueuesRecalculatePrices.name, {
    timestamp: true,
  });
  constructor(
    private readonly stageingProductVariantService: StagingProductVariantService,
    private readonly basePricesService: BasePricesService,
    private readonly usdPricesService: UsdPricesService,
  ) {
    super();
  }
  async process(job: Job<any, IRecalculatePrices, string>): Promise<any> {
    try {
      const { gameID, id, subId, price, usdPrice } = job.data as IRecalculatePrices;

      let pricesResponse: IUsdPrice | IBasePriceUpdate
      let calculatedPrice: any

      //recalcular precios por cambio del dolar
      if (gameID && usdPrice){
        await job.updateProgress(25);
        pricesResponse = await this.usdPricesService.updateUsdPriceByGame(gameID, usdPrice);
        await job.updateProgress(50);
        calculatedPrice = await this.stageingProductVariantService.calculatePricesForAllCards(
          undefined,
          undefined,
          pricesResponse.game as EnumGame,
          undefined
        )
        await job.updateProgress(100);
        
        //recalcular precios por cambio de base price
      }else if (id && subId && price) {
        await job.updateProgress(25);
        pricesResponse =  await this.basePricesService.updateBasePrices(id, subId, price);
        await job.updateProgress(50);
        calculatedPrice = await this.stageingProductVariantService.calculatePricesForAllCards(
          undefined,
          undefined,
          pricesResponse.game as EnumGame,
          pricesResponse.details.label
        )
        await job.updateProgress(100);
      }else {
        throw new Error('No se recibieron datos validos para recalcular precios');
      }
      return calculatedPrice;
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