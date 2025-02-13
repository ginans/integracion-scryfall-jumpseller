import { Controller, Get, Param, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Sale } from './entities/sale.entity';
import { PaginatedResponse } from '../common/interfaces/paginated-response.interface';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}
  @Get()
  async getSales(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Sale>> {
    return await this.salesService.findAllSales(query);
  }
  @Get(':id')
  async getSale(
    @Param('id') id: string
  ): Promise<Sale> {
    return await this.salesService.findOne(+id);
  }
}
