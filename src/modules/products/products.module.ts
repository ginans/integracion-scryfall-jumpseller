import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { ProductSchema, Product } from './entities/product.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { JumpsellerModule } from 'src/modules/jumpseller/jumpseller.module';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    JumpsellerModule,
  ],
  exports: [
    ProductsService,
    MongooseModule
  ],
})
export class ProductsModule {}
