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
    @InjectQueue("7-jumpseller-gateway") 
    private readonly jumpsellerGatewayQueue: Queue<{
      enCard: MagicCardDocument;
      esCard?: MagicCardDocument | null;
      body: ICreateImageRequest,
      requestType: RequestTypeEnum
    }, string, string>
  ) {
    super();
  }

  async process(job: Job<{ enCard: MagicCardDocument, esCard?: MagicCardDocument | null }, number, string>) {
    try {    
      const enImages = await this.magicCardsService.createImagesRequests(job.data.enCard);
      const esImages = job.data.esCard ? await this.magicCardsService.createImagesRequests(job.data.esCard) : [];
      const allImages = enImages.concat(esImages);

      for (const image of allImages) {
        console.log(`🔧 Enviando IMAGEN al POZOLE ✨: ${JSON.stringify(image)}`);
        try {
          await this.jumpsellerGatewayQueue.add(`Image to gateway`, {
            enCard: job.data.enCard,
            esCard: job.data.esCard || null,
            body: image,
            requestType: RequestTypeEnum.IMAGES
          },
            {
              priority: 3,
            }
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