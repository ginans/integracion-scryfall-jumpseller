import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

@Controller('order')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.orderService.findAllOrders(query);
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
