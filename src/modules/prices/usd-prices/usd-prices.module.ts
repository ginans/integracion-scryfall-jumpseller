import { Module } from '@nestjs/common';
import { UsdPricesService } from './usd-prices.service';
import { UsdPricesController } from './usd-prices.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { UsdPrice } from './entities/usd-price.entity';
import { UsdPriceSchema } from './entities/usd-price.entity';

@Module({
  controllers: [UsdPricesController],
  providers: [UsdPricesService],
  imports: [
    MongooseModule.forFeature([{ name: UsdPrice.name, schema: UsdPriceSchema }]),
  ],
  exports: [
    UsdPricesService,
    MongooseModule
  ],
})
export class UsdPricesModule {}
