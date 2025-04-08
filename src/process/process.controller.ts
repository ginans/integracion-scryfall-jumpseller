import { Controller, Post } from '@nestjs/common';
import { ProcessService } from './process.service';


@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService,
  ) { }

  @Post('magic')
  async procesarCardMagic(): Promise<string> {
    await this.processService.initCardMagic();
    return "ok"
  }
}
