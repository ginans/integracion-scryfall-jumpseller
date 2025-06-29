import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MagicCardsService } from './magic-cards.service';
import { MagicCardsController } from './magic-cards.controller';
import { MagicCard, magicCardSchema } from './entities/magic-card.entity';
import { ScryfallModule } from './submodules/scryfall/scryfall.module';
import { JumpsellerModule } from 'src/modules/jumpseller/jumpseller.module';
import { UsdPricesModule } from 'src/modules/prices/usd-prices/usd-prices.module';
import { BasePricesModule } from 'src/modules/prices/base-prices/base-prices.module';
import { StagingProductVariantModule } from '../staging-product-variant/staging-product-variant.module';
import { JumpsellerMapperService } from './mappers/jumpseller.mapper.service';
import { CustomFieldsMapperService } from './mappers/jumpseller.customfields.mapper.service';
import { ProcessModule } from '../process/process.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MagicCard.name, schema: magicCardSchema },
    ]),
    ScryfallModule,
    JumpsellerModule,
    UsdPricesModule,
    BasePricesModule,
    forwardRef(() => ProcessModule),
    forwardRef(() => StagingProductVariantModule),
  ],
  controllers: [MagicCardsController],
  providers: [
    MagicCardsService,
    JumpsellerMapperService,
    CustomFieldsMapperService,
  ],
  exports: [
    ScryfallModule,
    MagicCardsService,
    MongooseModule,
    CustomFieldsMapperService,
  ],
})
export class MagicCardsModule {}
