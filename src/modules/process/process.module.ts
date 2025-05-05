import { Module } from '@nestjs/common';
import { ProcessService } from './process.service';
import { QueuesMagic } from './queues/queues.magic';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ProcessController } from './process.controller';
import { MagicCardsModule } from 'src/modules/magic/magic-cards.module';
import { QueuesStock } from './queues/queues.stock';
import { JumpsellerModule } from 'src/modules/jumpseller/jumpseller.module';
import { StagingProductVariantModule } from '../products/staging-product-variant/staging-product-variant.module';

@Module({
  imports: [
    MagicCardsModule,
    JumpsellerModule,
    StagingProductVariantModule,
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
    BullModule.registerQueue({
      name: 'queues-prices',
      defaultJobOptions: {
        delay: 3000,
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'queues-prices',
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [ProcessController],
  exports: [ProcessService, BullModule],
  providers: [ProcessService, QueuesMagic, QueuesStock],

})
export class ProcessModule {
}
