import { Injectable } from '@nestjs/common';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class StockService {

  // async updateStock(product: StockJumpsellerRequest) {
  //     // Recibir id y el stock
  //     await this.magicCardModel.updateOne(
  //       { 
  //         idJumpSeller: product.product_id, 
  //         "stock.variantId": product.variant_id,
  //         "stock.productId": product.product_id,
  //       },
  //       {
  //         $set: {
  //           "stock.$.stock": product.stock
  //         }
  //       }
  //     );
      
  //     //traer la data de base de datos
  //     const magicCard = await this.magicCardModel.findOne(
  //       {
  //         "stock.productId": product.product_id, 
  //         "stock.variantId": product.variant_id
  //       }
  //     );
     
  //     if (magicCard) {
  //       //encontrar la variante específica en el array de stock
  //       const stockItem = magicCard.stock.find(item => item.variant_id === product.variant_id);
  
        
  //       interface StockMappingResult {
  //         stock: number;
  //         product_id: number;
  //         variant_id: number;
  //         location_id?: number;
  //         stock_unlimited?: boolean;
  //       }
  //         if (stockItem){
  //           const mapStockItemToJumpsellerRequest = (stockItem: Stock): StockMappingResult => {
  //             return {
  //               stock: stockItem.stock,
  //               product_id: stockItem.product_id,
  //               variant_id: stockItem.variant_id,
  //               location_id: stockItem.location_id,
  //               stock_unlimited: stockItem.stock_unlimited
  //             };
  //           };
  
  //           console.log(`🤡cuerpo de stock con ULTTRA typado: ${mapStockItemToJumpsellerRequest(stockItem) as StockMappingResult}`);
            
  //           const stockRequest = mapStockItemToJumpsellerRequest(stockItem);
  //           // [Nest] 484  - 24-04-2025, 2:01:18 a. m.   DEBUG [JumpsellerService] Cuerpo de la solicitud: {"stock":10,"product_id":0,"variant_id":0,"location_id":46801,"stock_unlimited":false}
  //           this.logger.log(` 🦍 body de stock enviado a jumpseller ${JSON.stringify(stockRequest)}`);
  //           await this.jumpsellerService.addStocktoJumpseller(stockRequest); 
  //         }
  //     }
      
  //     return true;
  //   }
}
