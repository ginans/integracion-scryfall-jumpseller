import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MagicCardsService } from './magic-cards.service';
import { MagicCardsController } from './magic-cards.controller';
import { MagicCard, magicCardSchema } from './entities/magic-card.entity';
import { ScryfallModule } from './scryfall/scryfall.module';
import { JumpsellerModule } from 'src/jumpseller/jumpseller.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MagicCard.name, schema: magicCardSchema }]),
    ScryfallModule,
    JumpsellerModule,
  ],
  controllers: [MagicCardsController],
  providers: [MagicCardsService],
  exports:[ScryfallModule,MagicCardsService]
})
export class MagicCardsModule {}
