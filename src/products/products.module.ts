import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Product, productSchema } from './entities/product.entity';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: productSchema }]),
    ConfigModule,
  ],
  exports: [ProductsService],
})
export class ProductsModule {}
