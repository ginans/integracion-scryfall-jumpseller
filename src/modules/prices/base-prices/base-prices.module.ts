import { Module } from '@nestjs/common';
import { BasePricesService } from './base-prices.service';
import { BasePricesController } from './base-prices.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BasePrice, BasePriceSchema } from './entities/base-price.entity';
import { StagingProductVariantModule } from 'src/modules/products/staging-product-variant/staging-product-variant.module';

@Module({
  controllers: [BasePricesController],
  providers: [BasePricesService],
  imports: [
    MongooseModule.forFeature([{ name: BasePrice.name, schema: BasePriceSchema }]),
  ],
  exports: [BasePricesService, MongooseModule],
})
export class BasePricesModule {}
