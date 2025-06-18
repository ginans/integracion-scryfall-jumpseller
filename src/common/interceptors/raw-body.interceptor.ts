import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class RawBodyInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RawBodyInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Si ya tenemos el rawBody, continuamos
    if ((request as any).rawBody) {
      return next.handle();
    }

    // Obtener el raw body del request
    let rawBody = '';
    
    // Si el body ya fue parseado como objeto, lo convertimos de vuelta a string
    if (request.body && typeof request.body === 'object') {
      rawBody = JSON.stringify(request.body);
      this.logger.debug('Raw body reconstructed from parsed JSON object');
    } else if (typeof request.body === 'string') {
      rawBody = request.body;
      this.logger.debug('Raw body obtained from string body');
    } else if (Buffer.isBuffer(request.body)) {
      rawBody = request.body.toString('utf8');
      this.logger.debug('Raw body obtained from buffer');
    }

    // Agregar rawBody al request para que esté disponible en el guard
    (request as any).rawBody = rawBody;
    
    this.logger.debug(`Raw body length: ${rawBody.length}`);
    this.logger.debug(`Raw body preview: ${rawBody.substring(0, 100)}...`);

    return next.handle().pipe(
      map((data) => {
        return data;
      }),
    );
  }
}
