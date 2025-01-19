import { format, transports } from 'winston';
import 'winston-daily-rotate-file';

const logFormat = format.printf(({ timestamp, level, message, stack }) => {
  const date = new Date(timestamp as string | number | Date);
  const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  return `${formattedDate} - ${level.toUpperCase()}: ${message}${stack ? `Stack: ${stack}` : ''}`;
});

export const winstonConfig = {
  transports: [
    new transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '7d',
      format: format.combine(format.timestamp(), logFormat),
    }),
    new transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      format: format.combine(format.timestamp(), logFormat),
    }),
    new transports.Console({
      format: format.combine(format.colorize(), format.timestamp(), logFormat),
    }),
  ],
  exceptionHandlers: [
    new transports.DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      format: format.combine(format.timestamp(), logFormat),
    }),
    new transports.Console({
      format: format.combine(format.colorize(), format.timestamp(), logFormat),
    }),
  ],
  rejectionHandlers: [
    new transports.DailyRotateFile({
      filename: 'logs/rejections-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      format: format.combine(format.timestamp(), logFormat),
    }),
    new transports.Console({
      format: format.combine(format.colorize(), format.timestamp(), logFormat),
    }),
  ],
};