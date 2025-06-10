import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
// import { ILangUrlEnum } from '../../magic/submodules/scryfall/enums/lang.enum';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { JumpsellerProductRequest } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductRequest.interface';
import { JumpsellerCreateVariantRequest } from 'src/modules/jumpseller/interfaces/variants-jumpseller/JumpsellerCreateVariantRequest.interface';
import { Language } from 'src/modules/magic/mappers/jumpseller.mapper.service';
import { JumpsellerProductResponse } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductResponse.interface';
import { ICreateImageRequest } from 'src/modules/jumpseller/interfaces/create-image.interface';
// import { EnumLanguage } from '../../magic/enums/lang.enum';
// import { Language } from '../../magic/mappers/jumpseller.mapper.service';

@Processor('4-create-images-request', { concurrency: 80 })
export class CreateImagesRequestProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue("7-jumpseller-gateway") 
    private readonly jumpsellerGatewayQueue: Queue<{
      imageProductId: number,
      lang?: Language[], 
      imageRequest: ICreateImageRequest
    }, string, string>
  ) {
    super();
  }

  async process(job: Job<{ enCard: MagicCardDocument, esCard?: MagicCardDocument | null }, number, string>) {
    try {
      //mapeo de imagenes a un formato que Jumpseller entienda
      const enImages = await this.magicCardsService.createImagesRequests(job.data.enCard)
      for (const image of enImages) {
        try {
          await this.jumpsellerGatewayQueue.add(`Image to gateway`, { imageProductId: job.data.enCard.id, imageRequest: image });
        } catch (error) {
          console.error(`❌ Error al subir imagen: ${error.message}`);
        }
      }
      if (job.data.esCard) {
        const esImages = await this.magicCardsService.createImagesRequests(job.data.esCard);
        for (const image of esImages) {
          try {
            await this.jumpsellerGatewayQueue.add(`Image to gateway`, { imageProductId: job.data.esCard.id, imageRequest: image });
          } catch (error) {
            console.error(`❌ Error al subir imagen: ${error.message}`);
          }
        }
      }
      await job.updateProgress(75);
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}