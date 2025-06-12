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
import { CreateProductJumpsellerProcessor } from './processors/create-product-jumpseller.processor';
import { JumpsellerMapperService } from '../magic/mappers/jumpseller.mapper.service';
import { JumpsellerService } from '../jumpseller/jumpseller.service';
import { CreateVariantsRequestProcessor } from './processors/create-variants-request.processor';
import { CreateVariantJumpsellerProcessor } from './processors/create-variant-jumpseller.processor';
import { SaveOrderProcessor } from './processors/save-order.processor';
import { OrdersModule } from '../orders/orders.module';
import { UpdateStockSalesProcessor } from './processors/update-stock-sales.processor';

@Module({
  imports: [
    forwardRef(()=> MagicCardsModule),
    JumpsellerModule,
    StagingProductVariantModule,
    BasePricesModule,
    UsdPricesModule,
    OrdersModule,
    BullModule.registerQueue({
      name: '1-sync-magic-cards',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: '1-sync-magic-cards',
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: '2-create-magic-cards',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: '2-create-magic-cards',
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: '3-create-product-jumpseller',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: '3-create-product-jumpseller',
      adapter: BullMQAdapter,
    }),

    //Job Check Variants Cards
    BullModule.registerQueue({
      name: '4-create-variants-request',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: '4-create-variants-request',
      adapter: BullMQAdapter,
    }),

    //Job Create Variants
    BullModule.registerQueue({
      name: '5-create-variant-jumpseller',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: '5-create-variant-jumpseller',
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
    //recibir y guardar orden desde el webhook de jumpseller
    BullModule.registerQueue({
      name: "save-order",
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: "save-order",
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: "update-stock-sales",
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: "update-stock-sales",
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [ProcessController],
  exports: [ProcessService, BullModule],
  providers: [
    ProcessService,
    QueuesStock,
    QueuesApiPrices, 
    QueuesRecalculatePricesByBase,
    QueuesRecalculatePricesByUds,
    QueuesPricesFromFront,
    JumpsellerMapperService,
    JumpsellerService,
    SyncMagicCardsProcessor,
    CreateMagicCardsProcessor,
    CreateProductJumpsellerProcessor,
    CreateVariantsRequestProcessor,
    CreateVariantJumpsellerProcessor,
    SaveOrderProcessor,
    UpdateStockSalesProcessor
  ],
})
export class ProcessModule {}
