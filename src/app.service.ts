import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ProcessService } from "./process/process.service";

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name, {
    timestamp: true,
  });
  constructor(
    private readonly processService: ProcessService
  ) {}

  //ejecutar tarea cada 5 minutos
  @Cron(CronExpression.EVERY_30_SECONDS)
  async syncRefreshTokenApp() {
    this.logger.log("ejecutar tarea");
    await this.processService.init()

  }

}