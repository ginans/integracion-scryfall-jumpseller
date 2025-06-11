import { Injectable, Logger } from '@nestjs/common';
import Bottleneck from 'bottleneck';

@Injectable()
export class JumpsellerRateLimiterService {
  private readonly logger = new Logger(JumpsellerRateLimiterService.name);
  private readonly apiLimiter: Bottleneck;

  constructor() {
    this.apiLimiter = new Bottleneck({
      reservoir: 20,
      reservoirRefreshAmount: 20,
      reservoirRefreshInterval: 1000,
      maxConcurrent: 20,
      highWater: 1000,
      strategy: Bottleneck.strategy.OVERFLOW_PRIORITY,
    });

    this.apiLimiter.on('failed', async (error, jobInfo) => {
      const id = jobInfo.options?.id || 'unknown';
      const retries = jobInfo.retryCount ?? 0;

      this.logger.error(`🔴 Job ${id} failed: ${error.message}`);

      if (retries < 5) { // <-- puedes cambiar el número de reintentos aquí
        const retryDelay = 500 * (retries + 1); // backoff exponencial leve
        this.logger.warn(`🔁 Retrying job ${id} in ${retryDelay}ms (attempt ${retries + 1})`);
        return retryDelay;
      }

      // No retry
      this.logger.error(`❌ Job ${id} reached max retries`);
      return null;
    });
    
    this.apiLimiter.on('retry', (error, jobInfo) => {
      if (error) {
        this.logger.error(`🔴 Error during retry of job ${jobInfo.options?.id || 'unknown'}: ${error}`);
      }
      const id = jobInfo.options?.id || 'unknown';
      this.logger.warn(`♻️ Now retrying job ${id} (attempt ${jobInfo.retryCount + 1})`);

     
    });

    this.apiLimiter.on('depleted', (empty) => {
      if (empty) {
        this.logger.log('🚱 Rate limiter reservoir is empty, waiting for refresh...');
      }
    });
  }

  async schedule<T>(fn: () => Promise<T>, options?: { priority?: number; id?: string }): Promise<T> {
    return this.apiLimiter.schedule(options || {}, fn);
  }
}
