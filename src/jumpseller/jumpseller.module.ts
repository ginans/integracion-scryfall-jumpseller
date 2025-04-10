import { Module } from '@nestjs/common';
import { JumpsellerService } from './jumpseller.service';
import { JumpsellerController } from './jumpseller.controller';

@Module({
  controllers: [JumpsellerController],
  providers: [JumpsellerService],
  exports:[JumpsellerService]
})
export class JumpsellerModule {}
