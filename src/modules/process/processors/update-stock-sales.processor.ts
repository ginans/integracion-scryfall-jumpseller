import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OrdersService } from 'src/modules/orders/orders.service';
import { mapOrders } from 'src/modules/orders/mappers/orders.mapper';
import { OrderDocument } from 'src/modules/orders/entities/order.entity';
import { IOrder, ISaleData } from 'src/modules/jumpseller/interfaces/orders-jumpseller/saleData.interface';
import { StagingProductVariantService } from 'src/modules/staging-product-variant/staging-product-variant.service';


@Processor('update-stock-sales')
export class UpdateStockSalesProcessor extends WorkerHost {
  constructor( 
    private readonly stagingProductVariantService: StagingProductVariantService
  ) {
    super();
  }
  async process(job: Job<ISaleData , string, string>) {
    if (!job.data || !job.data.order) {
      throw new Error('Job data is missing or invalid');
    }
    try {
      job.updateProgress(25);
      const { order } = job.data;
      job.updateProgress(50);
      const updatedStockAndSales = await this.stagingProductVariantService.updateStock(order);
      job.updateProgress(100);
      return updatedStockAndSales;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}