import { Module } from '@nestjs/common';
import { BasePricesService } from './base-prices.service';
import { BasePricesController } from './base-prices.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BasePrice, BasePriceSchema } from './entities/base-price.entity';
import { RedisCacheService } from 'src/common/services/redis-cache.service';

@Module({
  controllers: [BasePricesController],
  providers: [BasePricesService, RedisCacheService],
  imports: [
    MongooseModule.forFeature([
      { name: BasePrice.name, schema: BasePriceSchema },
    ]),
  ],
  exports: [BasePricesService, MongooseModule],
})
export class BasePricesModule {}
