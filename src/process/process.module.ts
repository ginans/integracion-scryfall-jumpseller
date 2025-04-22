import { Module } from '@nestjs/common';
import { ProcessService } from './process.service';
import { QueuesMagic } from './queues/queues.magic';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ProcessController } from './process.controller';
import { MagicCardsModule } from 'src/magic/magic-cards.module';
import { QueuesStock } from './queues/queues.stock';
import { MagicCard, magicCardSchema } from 'src/magic/entities/magic-card.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { JumpsellerModule } from 'src/jumpseller/jumpseller.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MagicCard.name, schema: magicCardSchema }]),
    MagicCardsModule,
    JumpsellerModule,
    BullModule.registerQueue({
      name: 'queues-magic',
      defaultJobOptions: {
        delay: 3000,
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'queues-magic',
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: 'queues-stock',
      defaultJobOptions: {
        delay: 3000,
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'queues-stock',
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [ProcessController],
  exports: [ProcessService, BullModule],
  providers: [ProcessService, QueuesMagic, QueuesStock],

})
export class ProcessModule {
}
