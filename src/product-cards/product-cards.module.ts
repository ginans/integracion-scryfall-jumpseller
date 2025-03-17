import { Module } from '@nestjs/common';
import { ProductCardsService } from './product-cards.service';
import { ProductCardsController } from './product-cards.controller';

@Module({
  controllers: [ProductCardsController],
  providers: [ProductCardsService],
})
export class ProductCardsModule {}
