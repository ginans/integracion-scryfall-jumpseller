import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import * as winston from 'winston';
import { winstonConfig } from './winston.config';

@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  private logger: winston.Logger;
  private allowedUrls: string[] = [
    '/backend/v1/boleta',
    '/backend/v1/factura',
    '/backend/v1/despacho',
    '/backend/v1/notacredito',
    '/backend/v1/traspaso',
  ];
  constructor() {
    this.logger = winston.createLogger(winstonConfig);
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    if (!this.allowedUrls.includes(url)) return next.handle();
    const logData = {
      timestamp: new Date().toISOString(),
      method,
      url,
      body,
      headers,
    };

    this.logger.info('Incoming Request', logData);

    const now = Date.now();
    return next.handle().pipe(
      tap({
        next: (responseBody) => {
          this.logger.info('Request Completed', {
            ...logData,
            responseTime: `${Date.now() - now}ms`,
            body: responseBody, // This will log the response body
          });
        },
        error: (err) => {
          this.logger.error('Request Failed', {
            ...logData,
            responseTime: `${Date.now() - now}ms`,
            error: err.message,
          });
        },
      }),
    );
  }
}
