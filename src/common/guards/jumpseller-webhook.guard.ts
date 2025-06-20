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
    const rawBody = (request as any).rawBody;

    // Obtener el hash del header
    const receivedHash = request.headers['jumpseller-hmac-sha256'];
    
    if (!receivedHash) {
      this.logger.error('Missing Jumpseller-Hmac-Sha256 header');
      return false;
    }

    this.logger.debug(`Received hash: ${receivedHash}`);

    let bodyForHmac: Buffer;

    if (Buffer.isBuffer(rawBody)) {
      bodyForHmac = rawBody;
      this.logger.debug('Using rawBody from request');
    } else {
      this.logger.error('Raw body is not a Buffer. HMAC validation may fail.');
      return false;
    }

    this.logger.debug(`Body for HMAC length: ${bodyForHmac.length}`);
    this.logger.debug(`Body for HMAC preview: ${bodyForHmac.toString('utf8').substring(0, 100)}...`);

    if (!this.API_SECRET_KEY) {
      this.logger.error('JUMPSELLER_WEBHOOK_TOKEN not configured');
      return false;
    }

    try {
      // Calcular el hash esperado usando HMAC-SHA256
      const expectedHash = this.calculateHmac(bodyForHmac);
      this.logger.debug(`Expected hash: ${expectedHash}`);

      // Comparar hashes
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

  private calculateHmac(data: Buffer): string {
    const hmac = crypto.createHmac('sha256', this.API_SECRET_KEY);
    hmac.update(data);
    return hmac.digest('base64');
  }

  private compareHashes(received: string, expected: string): boolean {
    if (received !== expected) {
      return false;
    }
    
    return crypto.timingSafeEqual(
      Buffer.from(received),
      Buffer.from(expected)
    );
  }
}
