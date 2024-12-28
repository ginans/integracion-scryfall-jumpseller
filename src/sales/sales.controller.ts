import { Controller, Get, Query } from '@nestjs/common';
import { SalesService } from './sales.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginatedResult } from '../common/interface/paginated-result.interface';
import { Sale } from './entities/sale.entity';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}
  @Get()
  async getSales(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<Sale>> {
    return await this.salesService.findAllSales(query);
  }
}
