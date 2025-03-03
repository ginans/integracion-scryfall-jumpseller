import { Module } from '@nestjs/common';
import { ReceptionsService } from './receptions.service';
import { ReceptionsController } from './receptions.controller';
import { Reception, ReceptionsSchema } from './entities/reception.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  controllers: [ReceptionsController],
  providers: [ReceptionsService],
  imports: [
    MongooseModule.forFeature([{ name: Reception.name, schema: ReceptionsSchema }]),
    ConfigModule,
  ],
  exports: [ReceptionsService],
})
export class ReceptionsModule {}
 