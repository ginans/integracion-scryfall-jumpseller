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
          token: '85e05bc1-d942-4132-a78e-ac0738533a52',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AgilizarService],
  exports: [AgilizarService],
})
export class AgilizarModule {}
