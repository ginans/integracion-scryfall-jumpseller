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

  private allowedUrls: string[] = [
    '/backend/v1/boleta',
    '/backend/v1/factura',
    '/backend/v1/despacho',
    '/backend/v1/notacredito',
    '/backend/v1/traspaso',
  ];

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'http') {
      return this.logHttpCall(context, next);
    }
  }
  private async pushToGrafana(body: string) {
    const logs = {
      streams: [
        {
          stream: {
            env: process.env.NODE_ENV,
          },
          values: [[(Date.now() * 1e6).toString(), body]],
        },
      ],
    };
    try {
      // await firstValueFrom(
      //   this.httpService
      //     .post('URL Grafana', logs, {
      //       headers: {
      //         'Content-Type': 'application/json',
      //         // Authorization: `Bearer ${Config.grafana.userId}:${Config.grafana.api}`,
      //       },
      //     })
      //     .pipe(
      //       catchError((error: AxiosError) => {
      //         this.logger.error(error.response.data);
      //         throw error;
      //       }),
      //     ),
      // );
    } catch (error) {
      this.logger.error(error.toString());
    }
  }
  private logHttpCall(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const userAgent = request.get('user-agent') || '';
    const { ip, method, path: url, body, headers } = request;
    if (!this.allowedUrls.includes(url)) return next.handle();
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
        await this.pushToGrafana(logData);
      }),
    );
  }
}
