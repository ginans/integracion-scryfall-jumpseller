import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ProcessService } from "./modules/process/process.service";

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name, {
    timestamp: true,
  });
  constructor(
    private readonly processService: ProcessService
  ) {}

  //ejecutar tarea cada 5 minutos
  @Cron(CronExpression.EVERY_WEEK)
  async syncRefreshTokenApp() {
    this.logger.log(`Ejecutar colas cartas magic EVERY_WEEK`);
    await this.processService.initCardMagic()
  }
}