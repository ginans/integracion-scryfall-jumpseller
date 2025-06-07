import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { Language } from '../../magic/mappers/jumpseller.mapper.service';
import { EnumLanguage } from 'src/modules/magic/enums/lang.enum';

@Processor('4-create-variants-request', { concurrency: 20 })
export class CreateVariantsRequestProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('5-create-variant-jumpseller') private readonly createVariantQueue: Queue
  ) {
    super();
  }
  async process(job: Job<{ enCard: MagicCardDocument, esCard?: MagicCardDocument | null, lang: Language[], productId: number}, string, string>) {
    try {
      const languages: Language[] = []
      languages.push({ code: EnumLanguage.INGLES, name: 'Inglés' });//TODO: Cambiar a un enum
      if (job.data.esCard) languages.push({ code: EnumLanguage.ESPAÑOL, name: 'Español' });
      const variantsRequest = await this.magicCardsService.createVariantsBody(job.data.enCard, job.data.lang);
      await Promise.all(variantsRequest.map((variant) => {
        this.createVariantQueue.add(`Variant: ${variant.variant.sku}`, { variant, productId: job.data.productId});
      }));
      return `card: ${job.data.enCard.id}, variants: ${variantsRequest.length}`;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}