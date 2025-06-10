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

    this.apiLimiter.on('failed', (error) => {
      this.logger.error(`Rate limiter job failed: ${error.message}`, error.stack);
    });

    this.apiLimiter.on('retry', (error) => {
      this.logger.warn(`Retrying API call: ${error}`);
    });

    this.apiLimiter.on('depleted', (empty) => {
      if (empty) {
        this.logger.log('Rate limiter reservoir is empty, waiting for refresh...');
      }
    });

    this.apiLimiter.on('debug', (message, data) => {
      this.logger.debug(`Rate limiter: ${message}`, data);
    });
  }

  async schedule<T>(fn: () => Promise<T>, options?: { priority?: number }): Promise<T> {
    return this.apiLimiter.schedule(options || {}, fn);
  }

}
