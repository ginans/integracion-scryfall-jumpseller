import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderStateDto } from './dto/order-state.dto';
import { PaginationOrdersQueryDto } from './dto/pagination-query.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAll(@Query() query: PaginationOrdersQueryDto) {
    return this.ordersService.findAllOrders(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOneOrder(id);
  }

  @Patch('change-state/:id')
  patchOrder(@Param('id') id: string, @Body() state: OrderStateDto) {
    return this.ordersService.changeOrderStates(id, state);
  }

}
