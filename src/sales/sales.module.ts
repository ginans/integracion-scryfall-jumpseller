import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { AgilizarModule } from '../agilizar/agilizar.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Sale, SaleSchema } from './entities/sale.entity';

@Module({
  controllers: [SalesController],
  providers: [SalesService],
  imports: [
    AgilizarModule,
    MongooseModule.forFeature([{ name: Sale.name, schema: SaleSchema }]),
  ],
  exports: [SalesService],
})
export class SalesModule {}
