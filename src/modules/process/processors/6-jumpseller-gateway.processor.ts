import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('6-jumpseller-gateway')
export class JumpsellerGatewayProcessor extends WorkerHost {
  constructor( 
  ) 
  {
    super();
  }
  async process(job: Job<any, string, string>) {
    try {
      // logica de gateway
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}