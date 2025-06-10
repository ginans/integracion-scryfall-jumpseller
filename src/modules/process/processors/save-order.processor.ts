import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OrdersService } from 'src/modules/orders/orders.service';
import { mapOrders } from 'src/modules/orders/mappers/orders.mapper';
import { OrderDocument } from 'src/modules/orders/entities/order.entity';
import { IOrder, ISaleData } from 'src/modules/jumpseller/interfaces/orders-jumpseller/saleData.interface';


@Processor('save-order')
export class SaveOrderProcessor extends WorkerHost {
  constructor( 
    private readonly ordersService: OrdersService 
  ) {
    super();
  }
  async process(job: Job< ISaleData , string, string>) {
    console.log('Processing job:', job.id, 'with data:', job.data);
    if (!job.data || !job.data.order) {
      throw new Error('Job data is missing or invalid');
    }
    try {
      job.updateProgress(25);
      const order = job.data.order;
      console.log('Mapped Order:', order);
      const mappedOrder = mapOrders(order as IOrder) as OrderDocument;
      job.updateProgress(50);
      const orderResponse = await this.ordersService.createOrders(mappedOrder);
      job.updateProgress(100);
      return orderResponse;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}