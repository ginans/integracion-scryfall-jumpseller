import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { OrderStateDto } from './dto/ok-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  findAllFull(@Query() query: PaginationQueryDto) {
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
