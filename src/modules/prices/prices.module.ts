import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';
import { UsdPricesModule } from './submodules/usd-prices/usd-prices.module';
import { BasePricesModule } from './submodules/base-prices/base-prices.module';

@Module({
  controllers: [PricesController],
  providers: [PricesService],
  imports: [
    UsdPricesModule,
    BasePricesModule,
  ],
})
export class PricesModule {}
