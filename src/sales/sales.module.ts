import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { AgilizarModule } from '../agilizar/agilizar.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Sale, SaleSchema } from './entities/sale.entity';
import { ClientsModule } from '../clients/clients.module';
import { ProductsModule } from '../products/products.module';
import { DefontanaModule } from '../defontana/defontana.module';

@Module({
  controllers: [SalesController],
  providers: [SalesService],
  imports: [
    AgilizarModule,
    DefontanaModule,
    ClientsModule,
    ProductsModule,
    MongooseModule.forFeature([{ name: Sale.name, schema: SaleSchema }]),
  ],
  exports: [SalesService],
})
export class SalesModule {}
