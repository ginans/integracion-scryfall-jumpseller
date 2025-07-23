import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ISaleData } from 'src/modules/jumpseller/interfaces/orders-jumpseller/saleData.interface';
import { VariantsService } from 'src/modules/variants/variants.service';

@Processor('update-stock-sales')
export class UpdateStockSalesProcessor extends WorkerHost {
  constructor(
    private readonly variantsService: VariantsService,
  ) {
    super();
  }
  async process(job: Job<ISaleData, string, string>) {
    if (!job.data || !job.data.order) {
      throw new Error('Job data is missing or invalid');
    }
    try {
      job.updateProgress(25);
      const { order } = job.data;
      job.updateProgress(50);
      const updatedStockAndSales =
        await this.variantsService.updateStock(order);
      job.updateProgress(100);
      return updatedStockAndSales;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
