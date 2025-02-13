import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {NestExpressApplication} from "@nestjs/platform-express";
import { join } from 'path';
import {LokiLogger} from "./common/logger/logging.service";
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule,{
    logger: new LokiLogger(),
  });
  app.useStaticAssets(join(__dirname, '..', 'uploads/pdfs'), {
    prefix: '/pdfs',
  });
  const config = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription('NestJS API description')
    .setVersion('1.0')
    .addTag('nestjs')
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('backend/docs', app, documentFactory);
  const logger = new Logger('NestBootstrap');
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  app.setGlobalPrefix('backend');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  const configService = app.get(ConfigService);
  const port: number = configService.get<number>('port');
  await app.listen(port);
  logger.log(`Server running on port ${port}`);
}
bootstrap();
