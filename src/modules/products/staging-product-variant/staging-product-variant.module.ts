import { forwardRef, Module } from '@nestjs/common';
import { StagingProductVariantService } from './staging-product-variant.service';
import { StagingProductVariantController } from './staging-product-variant.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { StagingProductVariant, StagingProductVariantSchema } from './entities/staging-product-variant.entity';
import { JumpsellerModule } from 'src/modules/jumpseller/jumpseller.module';
import { Product } from '../entities/product.entity';
import { ProductsModule } from '../products.module';

@Module({
  controllers: [StagingProductVariantController],
  providers: [StagingProductVariantService],
  imports: [
    MongooseModule.forFeature([{ name: StagingProductVariant.name, schema: StagingProductVariantSchema }]),
    JumpsellerModule,
    ProductsModule,
  ],
  exports: [
    StagingProductVariantService,
    MongooseModule,
  ]
})
export class StagingProductVariantModule {}
