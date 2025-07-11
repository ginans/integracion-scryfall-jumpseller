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
import { QueuesApiPrices } from './queues/prices/queues.api-prices';
import { SaveMagicCardsProcessor } from './processors/2-save-magic-cards.processor';
import { SyncMagicCardsProcessor } from './processors/1-sync-magic-cards.processor';
import { JumpsellerMapperService } from '../magic/mappers/jumpseller.mapper.service';
import { JumpsellerService } from '../jumpseller/jumpseller.service';
import { UpdateStockSalesProcessor } from './processors/update-stock-sales.processor';
// import { CreateVariantsRequestProcessor } from './processors/6-create-variants-request.processor';
import { JumpsellerGatewayProcessor } from './processors/8-jumpseller-gateway.processor';
import { CreateProductRequestProcessor } from './processors/3-create-product-request.processor';
import { SaveOrderProcessor } from './processors/save-order.processor';
import { OrdersModule } from '../orders/orders.module';
import { CreateImagesRequestProcessor } from './processors/4-create-images-request.processor';
import { CreateCustomFieldsRequestProcessor } from './processors/5-create-custom-fields-request.processor';
import { JumpsellerRequestCoordinatorProcessor } from './processors/7-jumpseller-request-coordinator.processor';
import { RedisCacheService } from 'src/common/services/redis-cache.service';
import { QueuesRecalculatePricesByUsd } from './queues/prices/queues.recalculate-prices-by-usd';
import { RecalculatePricesByUsdProcessor } from './processors/prices/recalculate-prices-by-usd';
import { SaveVariantsInBDProcessor } from './processors/save-variants-in-bd.processor';

@Module({
  imports: [
    forwardRef(() => MagicCardsModule),
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
      name: '2-save-magic-cards',
      defaultJobOptions: {
        lifo: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      },
    }),
    BullBoardModule.forFeature({
      name: '2-save-magic-cards',
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: '3-create-product-request',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: '3-create-product-request',
      adapter: BullMQAdapter,
    }),
    //Job Check Variants Cards
    BullModule.registerQueue({
      name: '4-create-images-request',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: '4-create-images-request',
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: '5-create-custom-fields-request',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: '5-create-custom-fields-request',
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: 'save-variants-in-bd',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'save-variants-in-bd',
      adapter: BullMQAdapter,
    }),
    // job jumpseller gateway
    BullModule.registerQueue({
      name: '7-jumpseller-request-coordinator',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: '7-jumpseller-request-coordinator',
      adapter: BullMQAdapter,
    }),
    //job jumpseller gateway
    BullModule.registerQueue({
      name: '8-jumpseller-gateway',
      defaultJobOptions: {
        lifo: true,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    }),
    BullBoardModule.forFeature({
      name: '8-jumpseller-gateway',
      adapter: BullMQAdapter,
    }),
    // enviar stock cargado desde el front a jumpseller
    BullModule.registerQueue({
      name: 'queues-stock',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'queues-stock',
      adapter: BullMQAdapter,
    }),
    //calcular y enviar precios de api a jumpseller
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
    //recalcular precios por precios base
    BullModule.registerQueue({
      name: 'queues-recalculate-prices-by-base',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'queues-recalculate-prices-by-base',
      adapter: BullMQAdapter,
    }),
    //recalcular precios por precios del dolar
    BullModule.registerQueue({
      name: 'recalculate-prices-by-usd',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'recalculate-prices-by-usd',
      adapter: BullMQAdapter,
    }),
    //actualizar precios desde el front, individuales y masivos
    BullModule.registerQueue({
      name: 'update-prices-from-front',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'update-prices-from-front',
      adapter: BullMQAdapter,
    }),
    //recibir y guardar orden desde el webhook de jumpseller
    BullModule.registerQueue({
      name: 'save-order',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'save-order',
      adapter: BullMQAdapter,
    }),
    BullModule.registerQueue({
      name: 'update-stock-sales',
      defaultJobOptions: {
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'update-stock-sales',
      adapter: BullMQAdapter,
    }),
  ],
  controllers: [ProcessController],
  exports: [ProcessService, BullModule],
  providers: [
    ProcessService,
    RedisCacheService,
    QueuesStock,
    QueuesApiPrices,
    QueuesRecalculatePricesByBase,
    QueuesRecalculatePricesByUsd,
    RecalculatePricesByUsdProcessor,
    SaveVariantsInBDProcessor,
    QueuesPricesFromFront,
    JumpsellerMapperService,
    JumpsellerService,
    SyncMagicCardsProcessor,
    SaveMagicCardsProcessor,
    CreateProductRequestProcessor,
    CreateImagesRequestProcessor,
    CreateCustomFieldsRequestProcessor,
    // CreateVariantsRequestProcessor,
    JumpsellerGatewayProcessor,
    UpdateStockSalesProcessor,
    SaveOrderProcessor,
    JumpsellerRequestCoordinatorProcessor,
  ],
})
export class ProcessModule {}
