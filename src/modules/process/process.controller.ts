import { Body, Controller, Patch, Post } from '@nestjs/common';
import { ProcessService } from './process.service';
import { IStockFromFront } from '../jumpseller/interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { IPriceFromFront } from '../staging-product-variant/interfaces/stagingProductVariant.interface';
import { RecalculatePricesByBaseDto } from './dto/recalculate-prices-by-base.dto';
import { RecalculatePricesByUsdDto } from './dto/recalculate-prices-by-usd.dto';
import { ISaleData } from '../jumpseller/interfaces/orders-jumpseller/saleData.interface';

@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService) {}
  /**
   * Endpoint que Obtiene las cartas de Magic desde Scryfall
   */
  @Post('magic')
  async procesarCardMagic(): Promise<void> {
    return this.processService.initCardMagic();
  }

  @Post('stock')
  async updateStock(@Body() variants: IStockFromFront[]) {
    try{
      return await this.processService.updateStockQueue(variants)
    }catch(error){
      return error
    }
  }
  
  @Post('prices/update-from-front')
  async updatePrices(@Body() variants: IPriceFromFront[]){
    try{
      return await this.processService.updatePricesFromFrontQueue(variants)
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
      return await this.processService.recalculatePricesByBase(basePrices) ;
    } catch (error) {
      return { error: error.message };
    }
  }
  @Patch('prices/recalculate-prices-by-usd')
  async recalculatePricesByUsd(
    @Body() usdPrices: RecalculatePricesByUsdDto,
  ) {
    try {
      return await this.processService.recalculatePricesByUsd(usdPrices) ;
    } catch (error) {
      return { error: error.message };
    }
  }

   @Post("webhook/orders")
  async handleOrdersWebhook(@Body() order: ISaleData) {
    try {
      await this.processService.handleOrdersWebhook(order);
      return { success: true, status: 200, message: "Orden Procesada Correctamente" };
    } catch (error) {
      return { error: error.message };
    }
  }

}
