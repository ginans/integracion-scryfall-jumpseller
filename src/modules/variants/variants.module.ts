import { forwardRef, Module } from '@nestjs/common';
import { VariantsService } from './variants.service';
import { VariantsController } from './variants.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Variants,
  VariantsSchema,
} from './entities/variants.entity';
import { JumpsellerModule } from 'src/modules/jumpseller/jumpseller.module';
import { MagicCardsModule } from 'src/modules/magic/magic-cards.module';
import { UsdPricesModule } from 'src/modules/prices/usd-prices/usd-prices.module';
import { BasePricesModule } from 'src/modules/prices/base-prices/base-prices.module';
import {
  StockAndSalesHistory,
  StockAndSalesHistorySchema,
} from './entities/stock-discount-and-sales-history.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  controllers: [VariantsController],
  providers: [VariantsService],
  imports: [
    MongooseModule.forFeature([
      { name: Variants.name, schema: VariantsSchema },
      { name: StockAndSalesHistory.name, schema: StockAndSalesHistorySchema },
    ]),
    JumpsellerModule,
    UsdPricesModule,
    BasePricesModule,
    OrdersModule,
    forwardRef(() => MagicCardsModule),
  ],
  exports: [VariantsService, MongooseModule],
})
export class VariantsModule {}
