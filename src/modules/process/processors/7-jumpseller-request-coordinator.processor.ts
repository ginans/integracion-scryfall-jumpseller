import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { Language } from 'src/modules/magic/mappers/jumpseller.mapper.service';

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
      const { enCard, esCard, thereIsSpanishVersion, productId, lang } = job.data; // Enviar todos los jobs hijos en paralelo, manejando errores individualmente
      const results = await Promise.allSettled([
        // Custom fields temporalmente deshabilitado para testing
        // this.CreateCustomFieldsRequestQueue.add(
        //   'create-custom-fields',
        //   { enCard: enCard, productId: productId },
        // ),

        this.CreateImagesRequestQueue.add('create-images', {
          enCard: enCard,
          esCard: esCard || null,
          productId: productId,
        }),

        this.CreateVariantsRequestQueue.add('create-variants', {
          enCard: enCard,
          esCard: esCard || null,
          thereIsSpanishVersion: thereIsSpanishVersion,
          productId: productId,
          lang: lang ,
        }),
      ]);

      // Verificar resultados individuales
      results.forEach((result, index) => {
        const jobNames = ['images', 'variants'];
        if (result.status === 'rejected') {
          console.error(`❌ Error en job ${jobNames[index]}: ${result.reason}`);
        } else {
          console.log(`✅ Job ${jobNames[index]} enviado exitosamente`);
        }
      });
    } catch (error) {
      console.error(
        `❌ Error al procesar coordinacion de la request ${error.message}`,
      );
      throw new Error(`Job failed at step: ${error.message}`);
    }

    await job.updateProgress(100);
  }
}
