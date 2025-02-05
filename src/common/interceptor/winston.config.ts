import { format, transports } from 'winston';
import 'winston-daily-rotate-file';

const customFormat = format.printf(
  ({ timestamp, url, method, body, headers, responseTime, message }) => {
    const date = new Date(timestamp as string | number | Date);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    const formattedBody = JSON.stringify(body, null, 2);
    const formattedHeaders = JSON.stringify(headers, null, 2);

    if (message === 'Request Completed')
      return `${formattedDate} - ${method} ${url}\nResponse Time: ${responseTime}\nBody: ${formattedBody}\nHeaders: ${formattedHeaders}`;
    return `${formattedDate} - ${method} ${url}\nBody: ${formattedBody}\nHeaders: ${formattedHeaders}`;
  },
);

export const winstonConfig = {
  transports: [
    new transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '7d',
      format: format.combine(format.timestamp(), customFormat),
    }),
    new transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '7d',
      format: format.combine(format.timestamp(), customFormat),
    }),
  ],
};
