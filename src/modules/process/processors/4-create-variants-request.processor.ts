import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { Language } from '../../magic/mappers/jumpseller.mapper.service';

@Processor('4-create-variants-request', { concurrency: 20 })
export class CreateVariantsRequestProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('5-create-variant-jumpseller') private readonly createVariantQueue: Queue
  ) {
    super();
  }
  async process(job: Job<{ card: MagicCardDocument, lang: Language[], productId: number}, string, string>) {
    try {
      const variantsRequest = await this.magicCardsService.createVariantsBody(job.data.card, job.data.lang);
      await Promise.all(variantsRequest.map((variant) => {
        this.createVariantQueue.add(`Variant: ${variant.variant.sku}`, { variant, productId: job.data.productId});
      }));
      return `card: ${job.data.card.id}, variants: ${variantsRequest.length}`;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}