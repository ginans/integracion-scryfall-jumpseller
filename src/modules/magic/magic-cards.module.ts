import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MagicCardsService } from './magic-cards.service';
import { MagicCardsController } from './magic-cards.controller';
import { MagicCard, magicCardSchema } from './entities/magic-card.entity';
import { ScryfallModule } from './submodules/scryfall/scryfall.module';
import { JumpsellerModule } from 'src/modules/jumpseller/jumpseller.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsdPricesModule } from 'src/modules/prices/submodules/usd-prices/usd-prices.module';
import { UsdPrice, UsdPriceSchema } from 'src/modules/prices/submodules/usd-prices/entities/usd-price.entity';
import { BasePricesModule } from 'src/modules/prices/submodules/base-prices/base-prices.module';
import { BasePrice, BasePriceSchema } from 'src/modules/prices/submodules/base-prices/entities/base-price.entity';
import mongoose from 'mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MagicCard.name, schema: magicCardSchema }]),
    ProductsModule,
    ScryfallModule,
    JumpsellerModule,
    UsdPricesModule,
    BasePricesModule
  ],
  controllers: [MagicCardsController],
  providers: [MagicCardsService],
  exports:[ScryfallModule, MagicCardsService, MongooseModule]
})
export class MagicCardsModule {}
