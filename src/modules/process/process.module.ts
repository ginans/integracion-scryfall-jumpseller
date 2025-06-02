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
import { StagingProductVariantModule } from '../staging-product-variant/staging-product-variant.module';
import { QueuesApiPrices } from './queues/prices/queues.api-prices';
import { QueuesRecalculatePrices } from './queues/prices/queues.recalculate-prices';
import { BasePricesModule } from '../prices/base-prices/base-prices.module';
import { UsdPricesModule } from '../prices/usd-prices/usd-prices.module';

@Module({
  imports: [
    MagicCardsModule,
    JumpsellerModule,
    StagingProductVariantModule,
    BasePricesModule,
    UsdPricesModule,
    BullModule.registerQueue({
      name: 'queues-magic',
      defaultJobOptions: {
        // delay: 3000,
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
      name: 'queues-api-prices',
      defaultJobOptions: {
        delay: 3000,
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'queues-api-prices',
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: QueuesRecalculatePrices.name,
      defaultJobOptions: {
        delay: 3000,
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: QueuesRecalculatePrices.name,
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [ProcessController],
  exports: [ProcessService, BullModule],
  providers: [ProcessService, QueuesMagic, QueuesStock, QueuesApiPrices, QueuesRecalculatePrices],

})
export class ProcessModule {
}
