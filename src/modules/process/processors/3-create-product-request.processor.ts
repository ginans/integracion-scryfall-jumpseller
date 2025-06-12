import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { Language } from 'src/modules/magic/mappers/jumpseller.mapper.service';
import { EnumLanguage } from 'src/modules/magic/enums/lang.enum';
import { EnumStatus } from 'src/modules/magic/enums/status.enum';
import { JumpsellerProductResponse } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductResponse.interface';

@Processor('3-create-product-request', { concurrency: 80 })
export class CreateProductRequestProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('7-jumpseller-gateway')
    private readonly jumpsellerGatewayQueue: Queue<
      {
        productResponse: JumpsellerProductResponse;
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
        lang: Language[];
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
        esCard: MagicCardDocument | null;
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
      //jumpseller gateway
      const createdProduct = await this.magicCardsService.createProductJumpseller(mappedEnProduct);
      await job.updateProgress(10);
      if (!createdProduct) {
        throw new Error(
          `Fallo al crear producto para carta con id: ${job.data.enCard.id} y nombre: ${job.data.enCard.printedName}.`,
        );
      }
      await this.magicCardsService.updateJumpsellerId(
        job.data.enCard.id,
        createdProduct.product.id,
      );
      await job.updateProgress(15);
      const isCreatedProduct =
        await this.magicCardsService.findCardByJumpsellerId(createdProduct.product.id);
      if (
        !isCreatedProduct &&
        isCreatedProduct.status !== EnumStatus.COMPLETED
      ) {
        throw new Error(
          `El producto con el id ${createdProduct.product.id} no esta creado aún.`,
        );
      }
      await this.jumpsellerGatewayQueue.add(
        'create-product', //nombre del job
        {
          productResponse: createdProduct,
        }, //data
        {
          jobId: String(job.data.enCard.idJumpSeller),
          // parent: {id: job.data.enCard.id, queue: job.queueName},
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
          esCard: job.data.esCard,
          enCard: job.data.enCard,
        },
      );

      //Enviar a creacion de variantes
      await this.CreateVariantsRequestQueue.add(
        'create-variants', //nombre del job
        {
          enCard: job.data.enCard,
          esCard: job.data.esCard,
          lang:
            job.data.esCard && job.data.thereIsSpanishVersion
              ? [{ code: EnumLanguage.ESPAÑOL, name: 'Español' }]
              : [],
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
