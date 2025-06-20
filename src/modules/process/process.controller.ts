import { Body, Controller, Patch, Post, UseGuards, Logger, Req, UseInterceptors, RawBodyRequest } from '@nestjs/common';
import { ProcessService } from './process.service';
import { IStockFromFront } from '../jumpseller/interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { IPriceFromFront } from '../staging-product-variant/interfaces/stagingProductVariant.interface';
import { RecalculatePricesByBaseDto } from './dto/recalculate-prices-by-base.dto';
import { RecalculatePricesByUsdDto } from './dto/recalculate-prices-by-usd.dto';
import { ISaleData } from '../jumpseller/interfaces/orders-jumpseller/saleData.interface';
import { JumpsellerWebhookGuard } from 'src/common/guards/jumpseller-webhook.guard';
import { Request } from 'express';

@Controller('process')
export class ProcessController {
  private readonly logger = new Logger(ProcessController.name);
  
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
  @UseGuards(JumpsellerWebhookGuard)
  async handleOrdersWebhook(@Req() req: RawBodyRequest<Request<ISaleData>>) {
    try {
      this.logger.log('Webhook recibido correctamente');
      await this.processService.handleOrdersWebhook(req.body);
      return {
        success: true,
        status: 200,
        message: "Orden Procesada Correctamente"
      };
    } catch (error) {
      this.logger.error('Error procesando webhook:', error);
      return {
        success: false,
        status: 500,
        error: error.message
      };
    }
  }


  // @Post("webhook/test")
  //   async testWebhook(@Req() req: RawBodyRequest<Request>) {
  //    const raw = req.rawBody;
  //   this.logger.log('RAW:', raw);
  //   this.logger.log('existing raw', req['rawBody']);
  //   this.logger.log('tipo', typeof raw);
  //   this.logger.log('PARSED:', req.body);
  //   this.logger.log('Headers:', req.headers);
  //   this.logger.log('WWWENA CONCHALALORAAAA', raw? "LOGRADOOOOAAAAHHHHHHHHHHHH" : "NO LOGRADOOOOOOOOOOOOOOOOOOOOOOO:(");
  //   return { success: true, status: 200, message: "Webhook de prueba procesado correctamente" };
  //   }
}
