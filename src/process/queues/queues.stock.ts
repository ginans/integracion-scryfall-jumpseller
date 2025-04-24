import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { MagicCard, magicCardDocument } from 'src/magic/entities/magic-card.entity';
import { Stock } from '../interface/stock.interface';
import { JumpsellerService } from 'src/jumpseller/jumpseller.service';
import { StockJumpsellerRequest } from 'src/jumpseller/interfaces/stockToJumpseller/stockJumpsellerRequest.interface';

@Processor('queues-stock')
export class QueuesStock extends WorkerHost {
  private readonly logger = new Logger(QueuesStock.name, {
    timestamp: true,
  });
  constructor(
    @InjectModel(MagicCard.name) private readonly magicCardModel: Model<magicCardDocument>,
    private readonly jumpsellerService: JumpsellerService
  ) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    try {
      await job.updateProgress(25);
      await this.updateStock(job.data);
      await job.updateProgress(100);
      return 'done';
    } catch (error) {
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
  async updateStock(product: StockJumpsellerRequest) {
    // Recibir id y el stock
    await this.magicCardModel.updateOne(
      { 
        idJumpSeller: product.product_id, 
        "stock.variantId": product.variant_id,
        "stock.productId": product.product_id,
      },
      {
        $set: {
          "stock.$.stock": product.stock
        }
      }
    );
    
    //traer la data de base de datos
    const magicCard = await this.magicCardModel.findOne(
      {
        "stock.productId": product.product_id, 
        "stock.variantId": product.variant_id
      }
    );
   
    if (magicCard) {
      //encontrar la variante específica en el array de stock
      const stockItem = magicCard.stock.find(item => item.variant_id === product.variant_id);

      
      interface StockMappingResult {
        stock: number;
        product_id: number;
        variant_id: number;
        location_id?: number;
        stock_unlimited?: boolean;
      }
        if (stockItem){
          const mapStockItemToJumpsellerRequest = (stockItem: Stock): StockMappingResult => {
            return {
              stock: stockItem.stock,
              product_id: stockItem.product_id,
              variant_id: stockItem.variant_id,
              location_id: stockItem.location_id,
              stock_unlimited: stockItem.stock_unlimited
            };
          };

          console.log(`🤡cuerpo de stock con ULTTRA typado: ${mapStockItemToJumpsellerRequest(stockItem) as StockMappingResult}`);
          
          const stockRequest = mapStockItemToJumpsellerRequest(stockItem);
          // [Nest] 484  - 24-04-2025, 2:01:18 a. m.   DEBUG [JumpsellerService] Cuerpo de la solicitud: {"stock":10,"product_id":0,"variant_id":0,"location_id":46801,"stock_unlimited":false}
          this.logger.log(` 🦍 body de stock enviado a jumpseller ${JSON.stringify(stockRequest)}`);
          await this.jumpsellerService.addStocktoJumpseller(stockRequest); 
        }
    }
    
    return true;
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
    console.log(`Queue magic-cards completada u agotada`);
  }
}