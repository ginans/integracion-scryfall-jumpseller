import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobProcessor } from './jobs.processor';
import { JobsService } from './jobs.service';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'jobs',
      defaultJobOptions: {
        delay: 3000,
        lifo: true,
      },
    }),
    BullBoardModule.forFeature({
      name: 'jobs',
      adapter: BullMQAdapter,
    }),
  ],
  providers: [JobProcessor, JobsService],
  exports: [JobsService, BullModule],
})
export class JobsModule {}
