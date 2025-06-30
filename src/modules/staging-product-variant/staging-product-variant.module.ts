import { forwardRef, Module } from '@nestjs/common';
import { StagingProductVariantService } from './staging-product-variant.service';
import { StagingProductVariantController } from './staging-product-variant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StagingProductVariant, StagingProductVariantSchema } from './entities/staging-product-variant.entity';
import { JumpsellerModule } from 'src/modules/jumpseller/jumpseller.module';
import { MagicCardsModule } from 'src/modules/magic/magic-cards.module';
import { UsdPricesModule } from 'src/modules/prices/usd-prices/usd-prices.module';
import { BasePricesModule } from 'src/modules/prices/base-prices/base-prices.module';
import { StockAndSalesHistory, StockAndSalesHistorySchema } from './entities/stock-discount-and-sales-history.entity';
import { OrdersModule } from '../orders/orders.module';

@Module({
  controllers: [StagingProductVariantController],
  providers: [StagingProductVariantService],
  imports: [
    MongooseModule.forFeature([
      { name: StagingProductVariant.name, schema: StagingProductVariantSchema },
      { name: StockAndSalesHistory.name, schema: StockAndSalesHistorySchema },
    ]),
    JumpsellerModule,
    UsdPricesModule,
    BasePricesModule,
    OrdersModule,
    forwardRef(() => MagicCardsModule),
  ],
  exports: [
    StagingProductVariantService,
    MongooseModule,
  ]
})
export class StagingProductVariantModule {}
