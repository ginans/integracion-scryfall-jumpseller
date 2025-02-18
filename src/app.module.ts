import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { EnvConfiguration } from './config/app.config';
import { JoiValidationSchema } from './config/joi.validation';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { JwtService } from '@nestjs/jwt';
import { MailerModule } from '@nestjs-modules/mailer';
import { JobsService } from './jobs/jobs.service';
import { JobsModule } from './jobs/jobs.module';
import { BullModule } from '@nestjs/bullmq';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestLoggerInterceptor } from './common/interceptor/request-logger.interceptor';
import { LoggerService } from './common/logger/logger.service';
import { LoggerModule } from './common/logger/logger.module';
import { FilesModule } from './files/files.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import {join} from "path";

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
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: 'user',
          pass: 'pass',
        },
      },
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
