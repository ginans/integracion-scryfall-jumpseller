import { Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { winstonConfig } from './winston.config';

@Injectable()
export class LoggerService {
    private logger: winston.Logger;

    constructor() {
        this.logger = winston.createLogger(winstonConfig);
    }

    info(message: string, meta?: any) {
        this.logger.info(message, meta);
    }

    error(message: string, meta?: any) {
        this.logger.error(message, meta);
    }
    warn(message: string, meta?: any) {
        this.logger.warn(message, meta);
    }
    debug(message: string, meta?: any) {
        this.logger.debug(message, meta);
    }
    log(message: string, meta?: any) {
        this.logger.log(message, meta);
    }
}