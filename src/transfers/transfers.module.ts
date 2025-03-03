import { Module } from '@nestjs/common';
import { TransfersService } from './transfers.service';
import { TransfersController } from './transfers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Transfers, TransfersSchema } from './entities/transfers.entity';

@Module({
  controllers: [TransfersController],
  providers: [TransfersService],
  imports: [
      MongooseModule.forFeature([{ name: Transfers.name, schema: TransfersSchema }]),
      ConfigModule,
    ],
  exports: [TransfersService],
})
export class TransfersModule {}
  