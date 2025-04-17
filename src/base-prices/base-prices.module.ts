import { Module } from '@nestjs/common';
import { BasePricesService } from './base-prices.service';
import { BasePricesController } from './base-prices.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BasePrice, BasePriceSchema } from './entities/base-price.entity';

@Module({
  controllers: [BasePricesController],
  providers: [BasePricesService],
  exports: [BasePricesService],
  imports: [
    MongooseModule.forFeature([{ name: BasePrice.name, schema: BasePriceSchema }]),
  ],
})
export class BasePricesModule {}
