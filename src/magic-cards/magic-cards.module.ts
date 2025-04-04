import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MagicCardsService } from './magic-cards.service';
import { MagicCardsController } from './magic-cards.controller';
import { MagicCard, magicCardSchema } from './entities/magic-card.entity';
import { ScryfallService } from '../scryfall/scryfall.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MagicCard.name, schema: magicCardSchema }]),
  ],
  controllers: [MagicCardsController],
  providers: [MagicCardsService, ScryfallService],
})
export class MagicCardsModule {}
