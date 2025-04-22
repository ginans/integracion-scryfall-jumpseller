import { Body, Controller, Post } from '@nestjs/common';
import { ProcessService } from './process.service';
import { MagicCard, magicCardDocument } from 'src/magic/entities/magic-card.entity';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';


@Controller('process')
export class ProcessController {
  constructor(private readonly processService: ProcessService,
  ) { }

  @Post('magic')
  async procesarCardMagic(): Promise<string> {
    await this.processService.initCardMagic();
    return "ok"
  }
  @Post('stock')
  async updateStock(@Body() product: any){
    await this.processService.updateStockQueue(product);
    return "ok"
  }
}
