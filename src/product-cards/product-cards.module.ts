import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductCardsService } from './product-cards.service';
import { ProductCardsController } from './product-cards.controller';
import { ProductCard, productCardSchema } from './entities/product-card.entity';
import { ScryfallService } from '../scryfall/scryfall.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ProductCard.name, schema: productCardSchema }]),
  ],
  controllers: [ProductCardsController],
  providers: [ProductCardsService, ScryfallService],
})
export class ProductCardsModule {}
