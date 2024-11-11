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
          token: '8c441520-79fd-40bb-a0bf-b1248c835b43',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AgilizarService],
  exports: [AgilizarService],
})
export class AgilizarModule {}
