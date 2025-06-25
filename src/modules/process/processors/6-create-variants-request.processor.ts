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
    @InjectQueue('8-jumpseller-gateway')
    private readonly jumpsellerGatewayQueue: Queue<
      {
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
        thereIsSpanishVersion: boolean;
        requestType: RequestTypeEnum;
        body: JumpsellerCreateVariantRequestForBD;
        productId: number;
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
        thereIsSpanishVersion: boolean;
        productId: number;
        lang: Language[];
      },
      string,
      string
    >,
  ) {
    try {
      const{ enCard, esCard, thereIsSpanishVersion, productId, lang } = job.data;
      await job.updateProgress(25);
     
      const variantsRequest = await this.magicCardsService.createVariantsBody(
        enCard,
        lang
      );
      await job.updateProgress(50);
      console.log(
        `🔧 Enviando VARIANTESSS al POZOLE ✨: ${JSON.stringify(variantsRequest)}`,
      );
      await Promise.allSettled(
        variantsRequest.map((variant) => {
          console.log("comprobando la variante SOLITA del pozole 😭", variant);
          this.jumpsellerGatewayQueue.add(
            `Variant request: ${variant.variant.sku}`, //nombre del job
            {
              enCard: enCard,
              esCard: esCard || null,
              thereIsSpanishVersion: thereIsSpanishVersion,
              requestType: RequestTypeEnum.VARIANTS,
              body: variant,
              productId: productId,
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
