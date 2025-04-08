import { Module } from '@nestjs/common';
import { ProcessService } from './process.service';
import { QueuesMagic } from './queues/queues.magic';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ProcessController } from './process.controller';
import { MagicCardsModule } from 'src/magic/magic-cards.module';

@Module({
  imports: [
    MagicCardsModule,
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
  ],
  controllers: [ProcessController],
  exports: [ProcessService, BullModule],
  providers: [ProcessService, QueuesMagic],

})
export class ProcessModule {
}
