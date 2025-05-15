import { forwardRef, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductSchema, Product } from './entities/product.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { JumpsellerModule } from 'src/modules/jumpseller/jumpseller.module';
import { StockAndSalesHistory, StockAndSalesHistorySchema } from './entities/stock-discount-and-sales-history.entity';
import { StagingProductVariantModule } from './staging-product-variant/staging-product-variant.module';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: StockAndSalesHistory.name, schema: StockAndSalesHistorySchema }
    ]),
    JumpsellerModule,
    forwardRef(() => StagingProductVariantModule)
  ],
  exports: [
    ProductsService,
    MongooseModule
  ],
})
export class ProductsModule {}
