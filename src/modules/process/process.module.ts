import { Module, forwardRef } from '@nestjs/common';
import { ProcessService } from './process.service';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ProcessController } from './process.controller';
import { MagicCardsModule } from 'src/modules/magic/magic-cards.module';
import { QueuesStock } from './queues/queues.stock';
import { JumpsellerModule } from 'src/modules/jumpseller/jumpseller.module';
import { StagingProductVariantModule } from '../staging-product-variant/staging-product-variant.module';
import { QueuesPricesFromFront } from './queues/prices/queues-prices-from-front';
import { QueuesRecalculatePricesByBase } from './queues/prices/queues.recalculate-prices-by-base';
import { BasePricesModule } from '../prices/base-prices/base-prices.module';
import { UsdPricesModule } from '../prices/usd-prices/usd-prices.module';
import { QueuesRecalculatePricesByUds } from './queues/prices/queues.recalculate-prices-by-usd';
import { QueuesApiPrices } from './queues/prices/queues.api-prices';
import { CreateMagicCardsProcessor } from './processors/create-magic-cards.processor';
import { SyncMagicCardsProcessor } from './processors/sync-magic-cards.processor';

@Module({
  imports: [
    forwardRef(()=> MagicCardsModule),
    JumpsellerModule,
    StagingProductVariantModule,
    BasePricesModule,
    UsdPricesModule,
    //Job Sync Magic Cards
    BullModule.registerQueue({
      name: 'sync-magic-cards',
      defaultJobOptions: {
        lifo: true,

      },
    }),
    BullBoardModule.forFeature({
      name: 'sync-magic-cards',
      adapter: BullMQAdapter,
    }),
    //Job Create Magic Cards
    BullModule.registerQueue({
      name: 'create-magic-cards',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'create-magic-cards',
      adapter: BullMQAdapter,
    }),
    // Other queues
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
    //
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
    //
    BullModule.registerQueue({
      name: "queues-recalculate-prices-by-base",
      defaultJobOptions: {
        delay: 3000,
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: "queues-recalculate-prices-by-base",
      adapter: BullMQAdapter,
    }),
    //
    BullModule.registerQueue({
      name: "queues-recalculate-prices-by-usd",
      defaultJobOptions: {
        delay: 3000,
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: "queues-recalculate-prices-by-usd",
      adapter: BullMQAdapter,
    }),
    //
    BullModule.registerQueue({
      name: "update-prices-from-front",
      defaultJobOptions: {
        delay: 3000,
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: "update-prices-from-front",
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [ProcessController],
  exports: [ProcessService, BullModule],
  providers: [
    ProcessService,
    CreateMagicCardsProcessor,
    SyncMagicCardsProcessor,
    QueuesStock, 
    QueuesApiPrices, 
    QueuesRecalculatePricesByBase,
    QueuesRecalculatePricesByUds,
    QueuesPricesFromFront,
  ],

})
export class ProcessModule {}
