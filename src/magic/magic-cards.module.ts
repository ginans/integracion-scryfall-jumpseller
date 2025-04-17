import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MagicCardsService } from './magic-cards.service';
import { MagicCardsController } from './magic-cards.controller';
import { MagicCard, magicCardSchema } from './entities/magic-card.entity';
import { ScryfallModule } from './scryfall/scryfall.module';
import { JumpsellerModule } from 'src/jumpseller/jumpseller.module';
import { ProductsModule } from 'src/products/products.module';
import { UsdPricesModule } from 'src/usd-prices/usd-prices.module';
import { UsdPrice, UsdPriceSchema } from 'src/usd-prices/entities/usd-price.entity';
import { BasePricesModule } from 'src/base-prices/base-prices.module';
import { BasePrice, BasePriceSchema } from 'src/base-prices/entities/base-price.entity';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MagicCard.name, schema: magicCardSchema }]),
    MongooseModule.forFeature([{ name: UsdPrice.name, schema: UsdPriceSchema }]),
    MongooseModule.forFeature([{ name: BasePrice.name, schema: BasePriceSchema }]),
    ProductsModule,
    ScryfallModule,
    JumpsellerModule,
    UsdPricesModule,
    BasePricesModule
  ],
  controllers: [MagicCardsController],
  providers: [MagicCardsService],
  exports:[ScryfallModule, MagicCardsService]
})
export class MagicCardsModule {}
