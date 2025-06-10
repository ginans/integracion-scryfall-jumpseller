import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { Language } from '../../magic/mappers/jumpseller.mapper.service';
import { EnumLanguage } from 'src/modules/magic/enums/lang.enum';
import { JumpsellerCreateVariantRequest } from 'src/modules/jumpseller/interfaces/variants-jumpseller/JumpsellerCreateVariantRequest.interface';

@Processor('6-create-variants-request', { concurrency: 20 })
export class CreateVariantsRequestProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue("7-jumpseller-gateway") 
    private readonly jumpsellerGatewayQueue: Queue<{
      variantRequest: JumpsellerCreateVariantRequest,
      productId: number
    }, string, string>
  ) {
    super();
  }
  async process(job: Job<{
    enCard: MagicCardDocument,
    esCard?: MagicCardDocument | null,
    lang: Language[]
  }, string, string>) {
    try {
      await job.updateProgress(25);
      const languages: Language[] = []
      languages.push({ code: EnumLanguage.INGLES, name: 'Inglés' });//TODO: Cambiar a un enum
      if (job.data.esCard) languages.push({ code: EnumLanguage.ESPAÑOL, name: 'Español' });
      await job.updateProgress(50);
      const variantsRequest = await this.magicCardsService.createVariantsBody(job.data.enCard, job.data.lang);
      await job.updateProgress(75);
      await Promise.all(variantsRequest.map((variant) => {
        this.jumpsellerGatewayQueue.add(
          `Variant request: ${variant.variant.sku}`, //nombre del job
          { 
            variantRequest: variant, 
            productId: job.data.enCard.idJumpSeller
          });
      }));
      await job.updateProgress(100);
      return `card: ${job.data.enCard.id}, variants: ${variantsRequest.length}`;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}