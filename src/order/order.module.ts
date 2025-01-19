import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { AgilizarModule } from '../agilizar/agilizar.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { PaginationModule } from '../common/modules/pagination.module';
import { DefontanaModule } from '../defontana/defontana.module';
import { ProvidersModule } from '../providers/providers.module';

@Module({
  controllers: [OrderController],
  providers: [OrderService],
  imports: [
    AgilizarModule,
    PaginationModule,
    ProvidersModule,
    DefontanaModule,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
  exports: [OrderService],
})
export class OrderModule {}
