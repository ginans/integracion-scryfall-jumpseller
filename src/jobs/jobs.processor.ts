import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('jobs')
export class JobProcessor extends WorkerHost {
  async process(job: Job<any, any, string>): Promise<any> {
    const { orderId } = job.data;
    try {
      await this.createClient(orderId);
      await job.updateProgress(25);
      await this.createOrder(orderId);
      await job.updateProgress(50);
      await this.createInvoice(orderId);
      await job.updateProgress(75);
      await this.createPayment(orderId);
      await job.updateProgress(100);
      return 'done';
    } catch (error) {
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }

  async randomNr(state: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const nr = Math.floor(Math.random() * 100);
      setTimeout(() => {
        if (nr > 95) {
          reject(new Error(`Falló el estado ${state}`));
        }
        resolve(nr);
      }, 100);
    });
  }

  async createClient(orderId: string) {
    const nr = await this.randomNr('createClient');
    if (nr > 80) {
      throw new Error('Failed to create client');
    }
  }

  async createOrder(orderId: string) {
    const nr = await this.randomNr('createOrder');
    if (nr > 80) {
      throw new Error('Failed to create Order');
    }
  }

  async createInvoice(orderId: string) {
    const nr = await this.randomNr('createInvoice');
    if (nr > 80) {
      throw new Error('Failed to create Invoice');
    }
  }

  async createPayment(orderId: string) {
    const nr = await this.randomNr('createPayment');
    if (nr > 80) {
      throw new Error('Failed to create Payment');
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<any, any, string>) {
    console.log(`Job completed with result ${job.returnvalue}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any, any, string>) {
    console.log(`Job failed with reason ${job.failedReason}`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<any, any, string>) {
    console.log(`Job progress updated to ${job.progress}`);
  }

  @OnWorkerEvent('paused')
  onPaused(job: Job<any, any, string>) {
    console.log(`Job paused`);
  }

  @OnWorkerEvent('resumed')
  onResumed(job: Job<any, any, string>) {
    console.log(`Job resumed`);
  }

  @OnWorkerEvent('drained')
  onDrained() {
    console.log(`Queue drained`);
  }
}
