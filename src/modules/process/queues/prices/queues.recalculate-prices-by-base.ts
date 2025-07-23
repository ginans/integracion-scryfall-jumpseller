import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { VariantsService } from 'src/modules/variants/variants.service';
import { IVariant } from 'src/modules/variants/interfaces/variants.interface';

@Processor('queues-recalculate-prices-by-base')
export class QueuesRecalculatePricesByBase extends WorkerHost {
  private readonly logger = new Logger('queues-recalculate-prices-by-base', {
    timestamp: true,
  });
  constructor(
    private readonly variantsService: VariantsService,
  ) {
    super();
  }
  async process(job: Job<IVariant, any, string>): Promise<any> {
    //TODO: manejar casos para etched
    let rarityFoil;
    if (job.data.rarity === 'common' && job.data.finish === 'nonfoil') {
      rarityFoil = 'commonC';
    } else if (job.data.rarity === 'common' && job.data.finish === 'foil') {
      rarityFoil = 'commonC-Foil';
    } else if (
      job.data.rarity === 'uncommon' &&
      job.data.finish === 'nonfoil'
    ) {
      rarityFoil = 'uncommonU';
    } else if (job.data.rarity === 'uncommon' && job.data.finish === 'foil') {
      rarityFoil = 'uncommonU-Foil';
    } else if (job.data.rarity === 'rare' && job.data.finish === 'nonfoil') {
      rarityFoil = 'rareR';
    } else if (job.data.rarity === 'rare' && job.data.finish === 'foil') {
      rarityFoil = 'rareR-Foil';
    } else if (job.data.rarity === 'mythic' && job.data.finish === 'nonfoil') {
      rarityFoil = 'mythicM';
    } else if (job.data.rarity === 'mythic' && job.data.finish === 'foil') {
      rarityFoil = 'mythicM-Foil';
    } else {
      rarityFoil = `${job.data.rarity}, ${job.data.finish}`;
    }

    try {
      await job.updateProgress(25);
      await this.variantsService.calculatePricesByVariant(
        job.data,
        rarityFoil,
      );
      await job.updateProgress(100);
    } catch (error) {
      await job.moveToFailed(new Error(error.message), 'true');
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
