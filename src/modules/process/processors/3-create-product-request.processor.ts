import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { RequestTypeEnum } from '../enums/request-type.enum';
import { JumpsellerProductRequest } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductRequest.interface';
import { EnumLanguage } from 'src/modules/magic/enums/lang.enum';
import { Language } from 'src/modules/magic/mappers/jumpseller.mapper.service';
@Processor('3-create-product-request', { concurrency: 80 })
export class CreateProductRequestProcessor extends WorkerHost {
  private readonly logger = new Logger(CreateProductRequestProcessor.name);

  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('8-jumpseller-gateway')
    private readonly jumpsellerGatewayQueue: Queue<
      {
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
        thereIsSpanishVersion: boolean;
        requestType: RequestTypeEnum;
        body: JumpsellerProductRequest;
        lang: Language[];
      },
      string,
      string
    >
  ) {
    super();
  }

  async process(
    job: Job<
      {
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
        thereIsSpanishVersion: boolean;
      },
      number,
      string
    >,
  ) {
    try {
      const { enCard, esCard, thereIsSpanishVersion } = job.data;
      //pregunta si existe la carta en español, si existe le pasa el nombre en español
      await job.updateProgress(10);
      let descriptions: string[] = [];
      const languages: Language[] = []
      languages.push({ code: EnumLanguage.INGLES, name: 'Inglés' });
      if (esCard && thereIsSpanishVersion === true) {
        languages.push({ code: EnumLanguage.ESPAÑOL, name: 'Español' })
        const lang = await this.magicCardsService.translatedLanguages(
          esCard.lang,
        );
        descriptions.push(`Nombre en ${lang}: ${job.data.esCard.printedName}.`);
      }
      await job.updateProgress(20);

       const variantsRequest = await this.magicCardsService.createVariantsBody(
        enCard,
        languages
      );

      if (!variantsRequest || variantsRequest.length === 0) {
        throw new Error(
          `No se pudieron crear variantes para la carta con id: ${enCard.id} y nombre: ${enCard.name}`,
        );
      }
      
      //mapea la carta a un formato que Jumpseller entienda como producto
      const mappedEnProduct = await this.magicCardsService.mapCardData(
        job.data.enCard,
        descriptions,
        variantsRequest,
      );
      await job.updateProgress(50);
      // Solo crear producto si no existe y si tenemos los datos mapeados
      if (!mappedEnProduct) {
        throw new Error(
          `Datos del producto no mapeados para carta con id: ${enCard.id} y nombre: ${enCard.name}`,
        );
      }
      await job.updateProgress(80);

      //enviar al job final de Jumpseller Gateway
      await this.jumpsellerGatewayQueue.add(
        'create-product', //nombre del job
        {
          enCard: enCard,
          esCard: esCard || null,
          thereIsSpanishVersion: thereIsSpanishVersion,
          requestType: RequestTypeEnum.PRODUCTS,
          body: mappedEnProduct,
          lang: languages,
        }, //data
        {
          jobId: String(enCard.id),
          priority: 2,
        },
      );
      
      await job.updateProgress(100);
      return 'Product request created successfully';
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
