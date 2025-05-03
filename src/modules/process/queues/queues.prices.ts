import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';



@Processor('queues-prices')
export class QueuesPrices extends WorkerHost {
  private readonly logger = new Logger(QueuesPrices.name, {
    timestamp: true,
  });
  constructor(
  ) {
    super();
  }
  async process(job: Job<any, any, string>): Promise<any> {
    try {
    //   await job.updateProgress(25);
    //   await this.updatePrices(job.data); //hacer referencia a la funcion de abajo
    //   await job.updateProgress(100);
      return 'done';
    } catch (error) {
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
  //funcion oara actualizar precios

  async updatePrices() { //o crearla en otro lado e importarla aqui jeje
    
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
    console.log(`Queue prices completada u agotada`);
  }
}