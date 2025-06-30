import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { Language } from 'src/modules/magic/mappers/jumpseller.mapper.service';
import { ICreateImageRequest } from 'src/modules/jumpseller/interfaces/create-image.interface';
import { RequestTypeEnum } from '../enums/request-type.enum';

@Processor('4-create-images-request', { concurrency: 40 })
export class CreateImagesRequestProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('8-jumpseller-gateway')
    private readonly jumpsellerGatewayQueue: Queue<
      {
        requestType: RequestTypeEnum;
        body: ICreateImageRequest;
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
        esCard?: MagicCardDocument | null,
        productId: number;
      },
      number,
      string
    >,
  ) {
    try {
      const { enCard, esCard, productId } = job.data;
      const enImages = await this.magicCardsService.createImagesRequests(
        enCard,
      );
      const esImages = esCard
        ? await this.magicCardsService.createImagesRequests(esCard)
        : [];
      const allImages = enImages.concat(esImages);

      for (const image of allImages) {
        try {
          await this.jumpsellerGatewayQueue.add(
            `Image to gateway`,
            {
              requestType: RequestTypeEnum.IMAGES,
              body: image,
              productId: productId,
            },
            {
              priority: 3,
            },
          );
        } catch (error) {
          console.error(`❌ Error al subir imagen: ${error.message}`);
        }
      }
      await job.updateProgress(75);
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
