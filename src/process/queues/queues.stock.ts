import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { MagicCard, magicCardDocument } from 'src/magic/entities/magic-card.entity';
import { MagicCardsService } from 'src/magic/magic-cards.service';
import { IenumURLLang } from 'src/magic/scryfall/enums/lang.enum';
import { ScryfallCardResponse } from 'src/magic/scryfall/interfaces/scryfall.interface';
import { Stock } from '../interface/stock.interface';
import { Jumpseller } from 'src/jumpseller/entities/jumpseller.entity';
import { JumpsellerService } from 'src/jumpseller/jumpseller.service';
import { StockJumpsellerRequest } from 'src/jumpseller/interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { MappedMagicCard } from 'src/jumpseller/interfaces/mapped-magic-card.interface';

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
    // Recibir sku y el stock
    await this.magicCardModel.updateOne(
      { 
        idJumpSeller: product.product_id, 
        "stock.variant_id": product.variant_id,
        "stock.product_id": product.product_id,
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
        "stock.product_id": product.product_id, 
        "stock.variant_id": product.variant_id 
      }
    );
   
    if (magicCard) {
      //encontrar la variante específica en el array de stock
      const stockItem = magicCard.stock.find(item => item.variant_id === product.variant_id);
      
      if (stockItem) {
        //crear objeto para enviar a Jumpseller con los datos actualizados
        const stockRequest: StockJumpsellerRequest = {
          location_id: stockItem.location_id,
          product_id: stockItem.product_id,
          variant_id: stockItem.variant_id,
          stock: stockItem.stock,
          stock_unlimited: stockItem.stock_unlimited
        };
        
        await this.jumpsellerService.addStocktoJumpseller(stockRequest);
      }
    }
    
    console.log();
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