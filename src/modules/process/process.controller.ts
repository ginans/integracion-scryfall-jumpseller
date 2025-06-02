import { Body, Controller, Param, Patch, Post, Query } from '@nestjs/common';
import { ProcessService } from './process.service';
import { IStockFromFront } from '../jumpseller/interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { IPriceFromFront } from '../staging-product-variant/interfaces/stagingProductVariant.interface';
import { IRecalculatePrices } from './interfaces/recalculate-prices.interface';
import { RecalculatePricesByBaseDto } from './dto/recalculate-prices-by-base.dto';
import { RecalculatePricesByUsdDto } from './dto/recalculate-prices-by-usd.dto';

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
  
  @Post('prices/api-prices')
  async updatePrices(@Body() product: IPriceFromFront[]){
    try{
      const response = await this.processService.updatePricesQueue(product);
      return response
    }
    catch(error){
      return error
    }
  }

  @Patch('prices/recalculate-prices')
  async recalculatePrices(
    @Body() data: RecalculatePricesByBaseDto | RecalculatePricesByUsdDto,
  ) {
    try {
      const response = await this.processService.recalculatePrices(data);
      return response ;
    } catch (error) {
      return { error: error.message };
    }
  }

}
