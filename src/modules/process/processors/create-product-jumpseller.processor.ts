import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { ILangUrlEnum } from '../../magic/submodules/scryfall/enums/lang.enum';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { EnumLanguage } from '../../magic/enums/lang.enum';
import { Language } from '../../magic/mappers/jumpseller.mapper.service';

@Processor('3-create-product-jumpseller')
export class CreateProductJumpsellerProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('4-create-variants-request') private readonly checkVariantsQueue: Queue
  ) {
    super();
  }
  async process(job: Job<MagicCardDocument, number, string>) {
    const versionES = await this.magicCardsService.getCardInOtherLang(ILangUrlEnum.ES, job.data.oracleId, job.data.collectorNumber, job.data.set);
    try {
      let descriptions: string[] = [];
      if (versionES) {
        const lang = await this.magicCardsService.translatedLanguages(versionES.lang);
        descriptions.push(`Nombre en ${lang}: ${versionES.printed_name}.`);
      }
      const request = await this.magicCardsService.mapCardData(job.data, descriptions);
      await job.updateProgress(25);
      const response = await this.magicCardsService.createProductJumpseller(request);
      await this.magicCardsService.updateJumpsellerId(job.data.id, response.product.id);
      if (versionES) {
        await this.magicCardsService.createMagicCards(versionES);
        await this.magicCardsService.updateJumpsellerId(versionES.id, response.product.id);
      }
      await job.updateProgress(50);
      /**
       * Cargar Imágenes
       */
      const images = await this.magicCardsService.createImagesRequests(job.data)
      for (const image of images) {
        try {
          await this.magicCardsService.insertImages(response.product.id, image);
        } catch (error) {
          console.error(`❌ Error al subir imagen: ${error.message}`);
        }
        //delay para evitar problemas de rate limit
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      await job.updateProgress(75);
      /**
       * Cargar Custom Fields
       */
      await this.magicCardsService.processAndInsertCustomFields(job.data, response.product.id);
      const languages: Language[] = []
      languages.push({ code: EnumLanguage.INGLES, name: 'Inglés' });//TODO: Cambiar a un enum
      if (versionES) languages.push({ code: EnumLanguage.ESPAÑOL, name: 'Español' });//TODO: Cambiar a un enum
      await this.checkVariantsQueue.add(`Jumpseller: ${response.product.id}`, { card: job.data, lang: languages, productId: response.product.id });
      await job.updateProgress(100);
      return response.product.id;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}