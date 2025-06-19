import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Body } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { Language } from 'src/modules/magic/mappers/jumpseller.mapper.service';
import { EnumLanguage } from 'src/modules/magic/enums/lang.enum';
import { RequestTypeEnum } from '../enums/request-type.enum';
import { JumpsellerProductRequest } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductRequest.interface';
@Processor('3-create-product-request', { concurrency: 80 })
export class CreateProductRequestProcessor extends WorkerHost {
  private readonly logger = new Logger(CreateProductRequestProcessor.name);

  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('7-jumpseller-gateway')
    private readonly jumpsellerGatewayQueue: Queue<
      {
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
        thereIsSpanishVersion: boolean;
        body: JumpsellerProductRequest;
        requestType: RequestTypeEnum;
      },
      string,
      string
    >,

    @InjectQueue('4-create-images-request')
    private readonly CreateImagesRequestQueue: Queue<
      {
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
      },
      string,
      string
    >,

    @InjectQueue('5-create-custom-fields-request')
    private readonly CreateCustomFieldsRequestQueue: Queue<
      {
        enCard: MagicCardDocument;
      },
      string,
      string
    >,

    @InjectQueue('6-create-variants-request')
    private readonly CreateVariantsRequestQueue: Queue<
      {
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
        thereIsSpanishVersion: boolean;
        // lang: Language[];
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
      },
      number,
      string
    >,
  ) {
    try {
      //pregunta si existe la carta en español, si existe le pasa el nombre en español
      await job.updateProgress(25);
      let descriptions: string[] = [];
      if (job.data.esCard && job.data.thereIsSpanishVersion === true) {
        const lang = await this.magicCardsService.translatedLanguages(
          job.data.esCard.lang,
        );
        descriptions.push(`Nombre en ${lang}: ${job.data.esCard.printedName}.`);
      }
      await job.updateProgress(50);
      //mapea la carta a un formato que Jumpseller entienda como producto
      const mappedEnProduct = await this.magicCardsService.mapCardData(
        job.data.enCard,
        descriptions,
      );
      // Solo crear producto si no existe y si tenemos los datos mapeados
      if (!mappedEnProduct) {
        throw new Error(
          `Datos del producto no mapeados para carta con id: ${job.data.enCard.id} y nombre: ${job.data.enCard.name}`,
        );
      }

      console.log(
        `📦 Datos del producto mapeado:`,
        JSON.stringify(mappedEnProduct),
      );

      this.logger.log(
        `Mapped product for Jumpseller: ${JSON.stringify(mappedEnProduct)}`,
      );
      await job.updateProgress(15);
      //enviar al job final de Jumpseller Gateway
      await this.jumpsellerGatewayQueue.add(
        'create-product', //nombre del job
        {
          enCard: job.data.enCard,
          esCard: job.data.esCard || null,
          thereIsSpanishVersion: job.data.thereIsSpanishVersion,
          body: mappedEnProduct,
          requestType: RequestTypeEnum.PRODUCTS,
        }, //data
        {
          jobId: String(job.data.enCard.id),
          priority: 2,
        },
      );

      await job.updateProgress(75);
      //enviar a cleacion de custom fields
      await this.CreateCustomFieldsRequestQueue.add(
        'create-custom-fields', //nombre del job
        { enCard: job.data.enCard },
      );
      //Enviar a creacion de imagenes
      await this.CreateImagesRequestQueue.add(
        'create-images', //nombre del job
        {
          enCard: job.data.enCard,
          esCard: job.data.esCard || null, //si no existe la carta en español, se envía null
        },
      );

      //Enviar a creacion de variantes
      await this.CreateVariantsRequestQueue.add(
        'create-variants', //nombre del job
        {
          enCard: job.data.enCard,
          esCard: job.data.esCard || null,
          thereIsSpanishVersion: job.data.thereIsSpanishVersion
          // lang:
          //   job.data.thereIsSpanishVersion === true 
          //     ? [{ code: EnumLanguage.ESPAÑOL, name: 'Español' }]
          //     : [],
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
