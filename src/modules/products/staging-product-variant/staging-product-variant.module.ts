import { forwardRef, Module } from '@nestjs/common';
import { StagingProductVariantService } from './staging-product-variant.service';
import { StagingProductVariantController } from './staging-product-variant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StagingProductVariant, StagingProductVariantSchema } from './entities/staging-product-variant.entity';
import { JumpsellerModule } from 'src/modules/jumpseller/jumpseller.module';
import { Product } from '../entities/product.entity';
import { ProductsModule } from '../products.module';
import { UsdPrice } from 'src/modules/prices/usd-prices/entities/usd-price.entity';
import { BasePrice } from 'src/modules/prices/base-prices/entities/base-price.entity';
import { MagicCardsModule } from 'src/modules/magic/magic-cards.module';
import { UsdPricesModule } from 'src/modules/prices/usd-prices/usd-prices.module';
import { BasePricesModule } from 'src/modules/prices/base-prices/base-prices.module';

@Module({
  controllers: [StagingProductVariantController],
  providers: [StagingProductVariantService],
  imports: [
    MongooseModule.forFeature([{ name: StagingProductVariant.name, schema: StagingProductVariantSchema }]),
    JumpsellerModule,
    UsdPricesModule,
    BasePricesModule,
    forwardRef(() => MagicCardsModule),
    forwardRef(() => ProductsModule),
  ],
  exports: [
    StagingProductVariantService,
    MongooseModule,
  ]
})
export class StagingProductVariantModule {}
