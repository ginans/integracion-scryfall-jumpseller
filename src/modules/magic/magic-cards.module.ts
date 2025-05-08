import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MagicCardsService } from './magic-cards.service';
import { MagicCardsController } from './magic-cards.controller';
import { MagicCard, magicCardSchema } from './entities/magic-card.entity';
import { ScryfallModule } from './submodules/scryfall/scryfall.module';
import { JumpsellerModule } from 'src/modules/jumpseller/jumpseller.module';
import { ProductsModule } from 'src/modules/products/products.module';
import { UsdPricesModule } from 'src/modules/prices/usd-prices/usd-prices.module';
import { BasePricesModule } from 'src/modules/prices/base-prices/base-prices.module';
import { StagingProductVariantModule } from '../products/staging-product-variant/staging-product-variant.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MagicCard.name, schema: magicCardSchema }]),
    ProductsModule,
    ScryfallModule,
    JumpsellerModule,
    UsdPricesModule,
    BasePricesModule,
    forwardRef(() => StagingProductVariantModule), 
  ],
  controllers: [MagicCardsController],
  providers: [MagicCardsService],
  exports:[ScryfallModule, MagicCardsService, MongooseModule]
})
export class MagicCardsModule {}
