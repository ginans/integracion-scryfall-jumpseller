import { Module } from '@nestjs/common';
import { DefontanaService } from './defontana.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Defontana, DefontanaSchema } from './entities/defontana.entity';

@Module({
  controllers: [],
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
    MongooseModule.forFeature([
      { name: Defontana.name, schema: DefontanaSchema },
    ]),
  ],
  providers: [DefontanaService],
  exports: [DefontanaService],
})
export class DefontanaModule {}
