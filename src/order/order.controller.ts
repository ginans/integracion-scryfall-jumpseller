import {Body, Controller, Get, Param, Post, Query, UseGuards} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { QueryResumeDto } from './dto/query-resume.dto';
import {GetReporteComprasResult} from "./interface/order-response.interface";
import {CreateDocumentDto} from "./dto/create-document.dto";

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @Get('national')
  findAllNational(@Query() query: PaginationQueryDto) {
    return this.orderService.findAllOrdersNational(query);
  }
  @Get('check')
  checkNewOrders() {
    return this.orderService.checkNewOrders();
  }
  @Get('imports')
  findAllImports(@Query() query: PaginationQueryDto) {
    return this.orderService.findAllOrdersImports(query);
  }
  @Get('resume')
  getResumeForOrders(@Query() query: QueryResumeDto) {
    return this.orderService.getResumeToDocuments(query);
  }
  @Get('form')
  getAttachmentToForm() {
    return this.orderService.getAttachmentToForm();
  }
  @Get(':id')
  getOrder(@Param('id') id: string) {
    return this.orderService.findOne(+id);
  }
  @Post()
  generateOrder(@Body() body: GetReporteComprasResult) {
    return this.orderService.processNewOrder(body);
  }
  @Post('document')
  generateDocument(@Body() body: CreateDocumentDto) {
    return this.orderService.createDocument(body);
  }
}
