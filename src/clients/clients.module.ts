import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { Client, clientSchema } from './entities/client.entity';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService],
  imports: [
    MongooseModule.forFeature([{ name: Client.name, schema: clientSchema }]),
    ConfigModule,
  ],
  exports: [ClientsService],
})
export class ClientsModule {}
