import { Module } from '@nestjs/common';
import { JumpsellerService } from './jumpseller.service';

@Module({
  controllers: [],
  providers: [JumpsellerService],
  exports:[JumpsellerService]
})
export class JumpsellerModule {}
