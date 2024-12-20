import { Module } from '@nestjs/common';
import { AgilizarService } from './agilizar.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Agilizar, AgilizarSchema } from './entities/agilizar.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [],
  imports: [
    MongooseModule.forFeature([
      { name: Agilizar.name, schema: AgilizarSchema },
    ]),
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<string>('url_fullerton'),
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AgilizarService],
  exports: [AgilizarService],
})
export class AgilizarModule {}
