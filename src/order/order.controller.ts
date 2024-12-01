import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('order')
@UseGuards(JwtAuthGuard)
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
  @Get(':id')
  generateBoleta(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }
}
