import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get("order-full")
  findAllFull(@Query() query: PaginationQueryDto) {
    return this.ordersService.findAllFullOrders(query);
  }

  @Get("orders")
  findAllOrders(@Query() query: PaginationQueryDto) {
    return this.ordersService.findAllOrders(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOneOrder(id);
  }

}
