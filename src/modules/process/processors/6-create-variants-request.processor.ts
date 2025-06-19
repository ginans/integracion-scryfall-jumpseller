import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { Language } from '../../magic/mappers/jumpseller.mapper.service';
import { EnumLanguage } from 'src/modules/magic/enums/lang.enum';
import { JumpsellerCreateVariantRequestForBD } from 'src/modules/jumpseller/interfaces/variants-jumpseller/JumpsellerCreateVariantRequest.interface';
import { RequestTypeEnum } from '../enums/request-type.enum';

@Processor('6-create-variants-request', { concurrency: 40 })
export class CreateVariantsRequestProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('7-jumpseller-gateway')
    private readonly jumpsellerGatewayQueue: Queue<
      {
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
        thereIsSpanishVersion: boolean;
        body: JumpsellerCreateVariantRequestForBD;
        // lang: Language[];
        requestType: RequestTypeEnum;
      },
      string,
      string
    >,
  ) {
    super();
  }
  async process(
    job: Job<
      {
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
        lang: Language[];
      },
      string,
      string
    >,
  ) {
    try {
      await job.updateProgress(25);
      const languages: Language[] = [];
      languages.push({ code: EnumLanguage.INGLES, name: 'Inglés' }); //TODO: Cambiar a un enum
      if (job.data.esCard)
        languages.push({ code: EnumLanguage.ESPAÑOL, name: 'Español' });
      await job.updateProgress(50);
      const variantsRequest = await this.magicCardsService.createVariantsBody(
        job.data.enCard,
        job.data.lang,
      );
      console.log(
        `🔧 Enviando VARIANTE al POZOLE ✨: ${JSON.stringify(variantsRequest)}`,
      );
      await job.updateProgress(75);
      await Promise.all(
        variantsRequest.map((variant) => {
          console.log(
            `🔧 Enviando variante al gateway POZOLE ✨: ${variant.variant.sku}`,
          );
          this.jumpsellerGatewayQueue.add(
            `Variant request: ${variant.variant.sku}`, //nombre del job
            {
              enCard: job.data.enCard,
              esCard: job.data.esCard,
              thereIsSpanishVersion: !!job.data.esCard,
              body: variant,
              requestType: RequestTypeEnum.VARIANTS,
            },
            {
              priority: 3,
            },
          );
        }),
      );
      await job.updateProgress(100);
      return `card: ${job.data.enCard.id}, variants: ${variantsRequest.length}`;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
