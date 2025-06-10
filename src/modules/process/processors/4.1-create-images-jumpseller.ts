import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
// import { ILangUrlEnum } from '../../magic/submodules/scryfall/enums/lang.enum';
import { MagicCardsService } from '../../magic/magic-cards.service';
// import { EnumLanguage } from '../../magic/enums/lang.enum';
// import { Language } from '../../magic/mappers/jumpseller.mapper.service';

@Processor('4.1-create-images-jumpseller')
export class CreateImagesJumpsellerProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('4-create-variants-request') private readonly checkVariantsQueue: Queue
  ) {
    super();
  }

  async process(job: Job<MagicCardDocument, number, string>) {
    try {
      //mapeo de imagenes a un formato que Jumpseller entienda
      const images = await this.magicCardsService.createImagesRequests(job.data)
      for (const image of images) {
        try {
          //envia la solicitud a Jumpseller para crear la imagen
          //TODO: ENVIAR A JOB FINAL PARA MANEJAR RATE LIMIT
          // await this.magicCardsService.insertImages(response.product.id, image);
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