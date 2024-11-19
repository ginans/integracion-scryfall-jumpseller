import { Module } from '@nestjs/common';
import { AgilizarService } from './agilizar.service';
import { AgilizarController } from './agilizar.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  controllers: [AgilizarController],
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: configService.get<string>('url_fullerton'),
        headers: {
          'Content-Type': 'application/json',
          token: '5fd15a5d-72b4-4fa0-89e5-d030b5dcb86d',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AgilizarService],
  exports: [AgilizarService],
})
export class AgilizarModule {}
