import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';

@Processor('7-jumpseller-request-coordinator')
export class JumpsellerRequestCoordinatorProcessor extends WorkerHost {
  constructor(
    @InjectQueue('4-create-images-request')
    private readonly CreateImagesRequestQueue: Queue<
      {
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
        productId: number;
      },
      string,
      string
    >,
    @InjectQueue('5-create-custom-fields-request')
    private readonly CreateCustomFieldsRequestQueue: Queue<
      {
        enCard: MagicCardDocument;
        productId: number;
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
        productId: number;
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
        productId: number;
      },
      string,
      string
    >,
  ) {
    try {
      const { enCard, esCard, thereIsSpanishVersion, productId } = job.data;

      await this.CreateCustomFieldsRequestQueue.add(
        'create-custom-fields', //nombre del job
        {
          enCard: enCard,
          productId: productId,
        },
      );
      //Enviar a creacion de imagenes
      await this.CreateImagesRequestQueue.add(
        'create-images', //nombre del job
        {
          enCard: enCard,
          esCard: esCard || null,
          productId: productId,
        },
      );

      //Enviar a creacion de variantes
      await this.CreateVariantsRequestQueue.add(
        'create-variants', //nombre del job
        {
          enCard: enCard,
          esCard: esCard || null,
          thereIsSpanishVersion: thereIsSpanishVersion,
          productId: productId,
          // lang:
          //   job.data.thereIsSpanishVersion === true
          //     ? [{ code: EnumLanguage.ESPAÑOL, name: 'Español' }]
          //     : [],
        },
      );
    } catch (error) {
      console.error(
        `❌ Error al procesar coordinacion de la request ${error.message}`,
      );
      throw new Error(`Job failed at step: ${error.message}`);
    }

    await job.updateProgress(100);
  }
}
