import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './modules/users/users.module';
import { ConfigModule } from '@nestjs/config';
import { EnvConfiguration } from './config/app.config';
import { JoiValidationSchema } from './config/joi.validation';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { JwtService } from '@nestjs/jwt';
import { JobsService } from './jobs/jobs.service';
import { JobsModule } from './jobs/jobs.module';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestLoggerInterceptor } from './common/interceptor/request-logger.interceptor';
import { LoggerService } from './common/logger/logger.service';
import { LoggerModule } from './common/logger/logger.module';
import { FilesModule } from './modules/files/files.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import {join} from "path";
import { ScryfallModule } from './modules/magic/submodules/scryfall/scryfall.module';
import { MagicCardsModule } from './modules/magic/magic-cards.module';
import { JumpsellerModule } from './modules/jumpseller/jumpseller.module';
import { ProcessModule } from './modules/process/process.module';
import { ProductsModule } from './modules/products/products.module';
import { BasePricesModule } from './modules/prices/submodules/base-prices/base-prices.module';
import { UsdPricesModule } from './modules/prices/submodules/usd-prices/usd-prices.module';
import { PricesModule } from './modules/prices/prices.module';
import { StockModule } from './modules/stock/stock.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [EnvConfiguration],
      validationSchema: JoiValidationSchema,
    }),
    MongooseModule.forRoot(EnvConfiguration().db_uri, {
      dbName: EnvConfiguration().db_name,
    }),
    BullModule.forRoot({
      connection: {
        url: EnvConfiguration().cache_url,
      },
    }),
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    ScheduleModule.forRoot(),
    UsersModule,
    AuthModule,
    MailModule,
    JobsModule,
    LoggerModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads/pdfs'),
      serveRoot: '/pdfs',
    }),
    FilesModule,
    ScryfallModule,
    MagicCardsModule,
    JumpsellerModule,
    ProcessModule,
    ProductsModule,
    UsdPricesModule,
    BasePricesModule,
    StockModule,
    PricesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtService,
    JobsService,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggerInterceptor,
    },
    LoggerService,
  ],
})
export class AppModule {}
