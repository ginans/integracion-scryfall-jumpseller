import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductSchema, ProductDocument, Product } from './entities/product.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { JumpsellerModule } from 'src/jumpseller/jumpseller.module';
import { ProductsPriceService } from './products.price.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService, ProductsPriceService],
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    JumpsellerModule,
  ],
  exports: [
    ProductsService,
    ProductsPriceService,
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])
  ],
})
export class ProductsModule {}
