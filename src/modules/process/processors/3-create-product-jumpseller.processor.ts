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

  //TODO: ESTE JOB SOLO DEBE PROCESAR LA CREACION DEL PRODUCTO EN JUMPSELLER, DEBE SER UN JOB INDEPENDIENTE
  async process(job: Job<{enCard: MagicCardDocument, esCard: MagicCardDocument | null, thereIsSpanishVersion: boolean}, number, string>) {
    try {
      //pregunta si existe la carta en español, si existe le pasa el nombre en español
      let descriptions: string[] = [];
      if (job.data.esCard && job.data.thereIsSpanishVersion === true) {
        const lang = await this.magicCardsService.translatedLanguages(job.data.esCard.lang);
        descriptions.push(`Nombre en ${lang}: ${job.data.esCard.printedName}.`);
      }
      //mapea la carta a un formato que Jumpseller entienda como producto
      const request = await this.magicCardsService.mapCardData(job.data.enCard, descriptions);
      await job.updateProgress(25);
      //envia la solicitud a Jumpseller para crear el producto
      //TODO: ENVIAR A JOB FINAL PARA MANEJAR RATE LIMIT
      const createdProduct = await this.magicCardsService.createProductJumpseller(request);
      await this.magicCardsService.updateJumpsellerId(job.data.enCard.id, createdProduct.product.id);
      await job.updateProgress(50);
      //si existe la version en español, crea las cartas en la base de datos con el id del producto creado en Jumpseller
      if (job.data.esCard && job.data.thereIsSpanishVersion === true) {
        await this.magicCardsService.updateJumpsellerId(job.data.esCard.id, createdProduct.product.id);
      }
      await job.updateProgress(75);
      const languages: Language[] = []
      languages.push({ code: EnumLanguage.INGLES, name: 'Inglés' });//TODO: Cambiar a un enum
      if (job.data.esCard) languages.push({ code: EnumLanguage.ESPAÑOL, name: 'Español' });//TODO: Cambiar a un enum
      await this.checkVariantsQueue.add(`Jumpseller: ${createdProduct.product.id}`, { card: job.data, lang: languages, productId: createdProduct.product.id });
      await job.updateProgress(100);
      return createdProduct.product.id;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}