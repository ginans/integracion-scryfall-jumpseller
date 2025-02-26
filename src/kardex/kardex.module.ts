import { Module } from '@nestjs/common';
import { KardexService } from './kardex.service';
import { KardexController } from './kardex.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Kardex, KardexSchema } from './entities/kardex.entity';

@Module({
  controllers: [KardexController],
  providers: [KardexService],
  imports: [
      MongooseModule.forFeature([{ name: Kardex.name, schema: KardexSchema }]),
      ConfigModule,
    ],
  exports: [KardexService],
})
export class KardexModule {}
 