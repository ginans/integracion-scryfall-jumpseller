import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Product, productSchema } from './entities/product.entity';

@Module({
  providers: [ProductsService],
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: productSchema }]),
    ConfigModule,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
