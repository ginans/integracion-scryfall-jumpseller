import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

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

  @Post('traspaso')
  traspaso() {
    return this.appService.genericResponse();
  }

  @Post('factura')
  factura() {
    return this.appService.genericResponse2();
  }

  @Post('despacho')
  despacho() {
    return this.appService.genericResponse3();
  }

  @Post('notacredito')
  notacredito() {
    return this.appService.genericResponse4();
  }

  @Post('boleta')
  boleta() {
    return this.appService.genericResponse2();
  }
}
