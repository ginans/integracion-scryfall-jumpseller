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
        // lang: Language[];
      },
      string,
      string
    >,
  ) {
    try {
      const{ enCard, esCard, thereIsSpanishVersion, productId } = job.data;
      await job.updateProgress(25);
      const languages: Language[] = [];
      //TODO: revisar envio de variantes
      languages.push({ code: EnumLanguage.INGLES, name: 'Inglés' }); //TODO: Cambiar a un enum
      if (job.data.thereIsSpanishVersion === true) {
        languages.push({ code: EnumLanguage.ESPAÑOL, name: 'Español' });
      }
      await job.updateProgress(50);
      const variantsRequest = await this.magicCardsService.createVariantsBody(
        job.data.enCard,
        languages
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
