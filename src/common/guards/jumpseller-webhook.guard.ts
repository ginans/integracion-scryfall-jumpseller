import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class JumpsellerWebhookGuard implements CanActivate {
  private readonly logger = new Logger(JumpsellerWebhookGuard.name);
  private readonly API_SECRET_KEY = process.env.JUMPSELLER_WEBHOOK_TOKEN;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const body = request.body;
    const rawBody = (request as any).rawBody;
    
    this.logger.debug('=== JUMPSELLER WEBHOOK VALIDATION START ===');
    this.logger.debug(`Headers: ${JSON.stringify(request.headers, null, 2)}`);
    this.logger.debug(`Body type: ${typeof body}`);
    this.logger.debug(`Body is Buffer: ${Buffer.isBuffer(body)}`);
    this.logger.debug(`Body is Array: ${Array.isArray(body)}`);
    this.logger.debug(`Raw body available: ${!!rawBody}`);
    this.logger.debug(`Raw body length: ${rawBody ? rawBody.length : 'N/A'}`);

    // Obtener el hash del header
    const receivedHash = request.headers['jumpseller-hmac-sha256'];
    
    if (!receivedHash) {
      this.logger.error('Missing Jumpseller-Hmac-Sha256 header');
      return false;
    }

    this.logger.debug(`Received hash: ${receivedHash}`);

    // Usar rawBody del interceptor si está disponible
    let bodyForHmac: string;
    
    if (rawBody && typeof rawBody === 'string') {
      bodyForHmac = rawBody;
      this.logger.debug('Using rawBody from interceptor');
    } else if (Buffer.isBuffer(body)) {
      // Si es Buffer (raw body-parser), convertir a string
      bodyForHmac = body.toString('utf8');
      this.logger.debug('Processing Buffer body as raw data');
    } else if (typeof body === 'string') {
      // Si ya es string, usar directamente
      bodyForHmac = body;
      this.logger.debug('Processing string body as raw data');
    } else if (typeof body === 'object' && body !== null) {
      // Si es objeto (parsed JSON), convertir de vuelta a string
      bodyForHmac = JSON.stringify(body);
      this.logger.warn('Processing object body - converting back to JSON string for HMAC validation');
    } else {
      this.logger.error(`Unsupported body type: ${typeof body}`);
      return false;
    }

    this.logger.debug(`Body for HMAC length: ${bodyForHmac.length}`);
    this.logger.debug(`Body for HMAC preview: ${bodyForHmac.substring(0, 100)}...`);

    if (!this.API_SECRET_KEY) {
      this.logger.error('JUMPSELLER_WEBHOOK_TOKEN not configured');
      return false;
    }

    try {
      // Calcular el hash esperado usando HMAC-SHA256
      const expectedHash = this.calculateHmac(bodyForHmac);
      this.logger.debug(`Expected hash: ${expectedHash}`);

      // Comparar hashes de forma segura
      const isValid = this.compareHashes(receivedHash, expectedHash);
      
      this.logger.debug(`Hash comparison result: ${isValid}`);
      this.logger.debug('=== JUMPSELLER WEBHOOK VALIDATION END ===');
      
      if (!isValid) {
        this.logger.error('Webhook signature validation failed');
      }
      
      return isValid;
    } catch (error) {
      this.logger.error(`Error during webhook validation: ${error.message}`);
      return false;
    }
  }

  /**
   * Calcula el HMAC-SHA256 exactamente como en PHP:
   * hash_hmac('sha256', data, secret, true) + base64_encode()
   */
  private calculateHmac(data: string): string {
    return crypto
      .createHmac('sha256', this.API_SECRET_KEY)
      .update(data, 'utf8')
      .digest('base64');
  }

  /**
   * Comparación segura de hashes (equivalente a hash_equals de PHP)
   */
  private compareHashes(received: string, expected: string): boolean {
    if (received.length !== expected.length) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(received),
      Buffer.from(expected)
    );
  }
}
