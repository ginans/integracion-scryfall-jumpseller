import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.orderService.findAllOrders(query);
  }
  @Get('resume')
  getResumeForOrders() {
    return this.orderService.getResumeToDocuments();
  }
  @Get('form')
  getAttachmentToForm() {
    return this.orderService.getAttachmentToForm();
  }
  @Get('check')
  checkOrders() {
    return this.orderService.checkNewOrders();
  }
  @Post()
  generateBoleta(@Body() body: any) {
    return this.orderService.processNewOrder(body);
  }
}
