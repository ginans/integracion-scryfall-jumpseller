import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
@Injectable()
export class RequestLoggerInterceptor implements NestInterceptor {
  constructor() {}
  private readonly logger = new Logger(RequestLoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'http') {
      return this.logHttpCall(context, next);
    }
  }
  
  private logHttpCall(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const userAgent = request.get('user-agent') || '';
    const { ip, method, path: url, body, headers } = request;
    const correlationKey = uuidv4();
    const userId = request.user?.userId;
    this.logger.log(`[${correlationKey}] ${method} ${url} ${userId} ${userAgent} ${ip}: ${context.getClass().name} ${context.getHandler().name} ${JSON.stringify(body)}`);
    const now = Date.now();
    return next.handle().pipe(
      tap(async () => {
        const response = context.switchToHttp().getResponse();
        response.setHeader('X-Correlation-Key', correlationKey);
        const { statusCode } = response;
        const contentLength = response.get('content-length');
        const logData = `[${correlationKey}] ${method} ${url} ${statusCode} ${contentLength}: ${
          Date.now() - now
        }ms`;
        this.logger.log(logData);
      }),
    );
  }
}

