import { Body, Controller, Param, Patch, Post, Query } from '@nestjs/common';
import { ProcessService } from './process.service';
import { IStockFromFront } from '../jumpseller/interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { IPriceFromFront } from '../staging-product-variant/interfaces/stagingProductVariant.interface';
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
  async updateStock(@Body() variants: IStockFromFront[]) {
    try{
      const response = await this.processService.updateStockQueue(variants);
      return response
    }catch(error){
      return error
    }
  }
  
  @Post('prices/update-from-front')
  async updatePrices(@Body() variants: IPriceFromFront[]){
    try{
      const response = await this.processService.updatePricesFromFrontQueue(variants);
      return response
    }
    catch(error){
      return error
    }
  }

  @Patch('prices/recalculate-prices-by-base')
  async recalculatePricesByBase(
    @Body() basePrices: RecalculatePricesByBaseDto
  ) {
    try {
      const response = await this.processService.recalculatePricesByBase(basePrices);
      return response ;
    } catch (error) {
      return { error: error.message };
    }
  }
  @Patch('prices/recalculate-prices-by-usd')
  async recalculatePricesByUsd(
    @Body() usdPrices: RecalculatePricesByUsdDto,
  ) {
    try {
      const response = await this.processService.recalculatePricesByUsd(usdPrices);
      return response ;
    } catch (error) {
      return { error: error.message };
    }
  }

}
