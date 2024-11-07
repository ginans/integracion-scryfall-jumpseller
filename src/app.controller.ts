import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  status() {
    return 'ok';
  }
  @UseGuards(JwtAuthGuard)
  @Get('get-validate')
  validate() {
    return 'ok';
  }
  @Get('seed')
  seed() {
    return this.appService.seed();
  }
}
