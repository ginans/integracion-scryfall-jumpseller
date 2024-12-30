import { Controller, Get, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { Sale } from './entities/sale.entity';
import { PaginatedResponse } from '../common/interface/paginated-response.interface';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}
  @Get()
  async getSales(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Sale>> {
    return await this.salesService.findAllSales(query);
  }
}
