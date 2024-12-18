import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class JobsService {
  constructor(@InjectQueue('jobs') private jobsQueue: Queue) {}

  async addJob(orderId: number) {
    await this.jobsQueue.add('job', { orderId });
  }
}
