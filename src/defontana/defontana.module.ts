import { Module } from '@nestjs/common';
import { DefontanaService } from './defontana.service';
import { DefontanaController } from './defontana.controller';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  controllers: [DefontanaController],
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        baseURL: configService.get<string>('url_defontana'),
        headers: {
          'Content-Type': 'application/json',
          token: `bearer ${configService.get<string>('')}`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [DefontanaService],
  exports: [DefontanaService],
})
export class DefontanaModule {}
