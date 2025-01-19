import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { TicketDto } from './sales/dto/ticket.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  status() {
    return 'ok';
  }
  @Get('seed')
  seed() {
    return this.appService.seed();
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
  @Get('test')
  testController() {
    return this.appService.test();
  }
}
