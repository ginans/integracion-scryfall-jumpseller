import { Body, Controller, Post } from '@nestjs/common';
import { ProcessService } from './process.service';
import { IStockFromFront } from '../jumpseller/interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { IPriceFromFront } from '../products/staging-product-variant/interfaces/stagingProductVariant.interface';

@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService,
  ) { }

  @Post('magic')
  async procesarCardMagic(): Promise<string> {
    try{
      await this.processService.initCardMagic();
    }catch(error){
      return error
    }
  }
  @Post('stock')
  async updateStock(@Body() product: IStockFromFront[]) {
    try{
      const response = await this.processService.updateStockQueue(product);
      return response
    }catch(error){
      return error
    }
 
  }
  @Post('prices')
  async updatePrices(@Body() product: IPriceFromFront[]){
    try{
      const response = await this.processService.updatePricesQueue(product);
      return response
    }
    catch(error){
      return error
    }
  }
}
