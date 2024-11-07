import { Module } from '@nestjs/common';
import { AgilizarService } from './agilizar.service';
import { AgilizarController } from './agilizar.controller';

@Module({
  controllers: [AgilizarController],
  providers: [AgilizarService],
})
export class AgilizarModule {}
