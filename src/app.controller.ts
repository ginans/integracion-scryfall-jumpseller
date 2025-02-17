import {Body, Controller, Get, Logger, Post} from '@nestjs/common';
import { AppService } from './app.service';
import { TicketDto } from './sales/dto/ticket.dto';
import {CreateBillDto} from "./sales/dto/bill.dto";

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly appService: AppService) {}

  @Get('health')
  status() {
    return 'ok';
  }
  @Post('factura')
  factura(@Body() body: CreateBillDto) {
    return this.appService.generateBill(body);
  }
  @Post('boleta')
  boleta(@Body() body: TicketDto) {
    return this.appService.generateTicket(body);
  }
  @Post('notacredito')
  notacredito() {
    return this.appService.genericResponse4();
  }
}
