import { Controller, Get, Body, Param } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Get()
  findAll() {
    return this.orderService.findAll();
  }
  @Get('check')
  checkOrders() {
    return this.orderService.checkNewOrders();
  }
  @Get('test')
  test(@Body() body: { to: string; from: string }) {
    return this.orderService.test(body);
  }
  @Get(':id')
  generateBoleta(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }
}
