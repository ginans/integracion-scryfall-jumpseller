import {Body, Controller, Get, Logger, Post} from '@nestjs/common';
import { AppService } from './app.service';
import { TicketDto } from './sales/dto/ticket.dto';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly appService: AppService) {}

  @Get('health')
  status() {
    this.logger.log('This is an info message');
    this.logger.warn('This is a warning');
    this.logger.error('This is an error');
    return 'ok';
  }
  @Post('factura')
  factura(@Body() body: any) {
    return this.appService.generateSale(body);
  }
  @Post('boleta')
  boleta(@Body() body: TicketDto) {
    return this.appService.generateSale(body);
  }
  @Post('traspaso')
  traspaso() {
    return this.appService.genericResponse();
  }
  @Post('despacho')
  despacho() {
    return this.appService.genericResponse3();
  }
  @Post('notacredito')
  notacredito() {
    return this.appService.genericResponse4();
  }
}
