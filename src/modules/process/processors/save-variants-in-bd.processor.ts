import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { VariantOptionsEnum } from '../enums/request-type.enum';
import { JumpsellerProductResponse } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductResponse.interface';
import { MagicCardDocument } from 'src/modules/magic/entities/magic-card.entity';

@Processor('save-variants-in-bd', { concurrency: 15 })
export class SaveVariantsInBDProcessor extends WorkerHost {
  constructor(private readonly magicCardsService: MagicCardsService) {
    super();
  }
  async process(
    job: Job<
      {
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
        createdProduct: JumpsellerProductResponse;
        thereIsSpanishVersion?: boolean;
      },
      string,
      string
    >,
  ) {
    const { enCard, esCard, createdProduct, thereIsSpanishVersion } = job.data;
    try {
      const createdProductInBD =
        await this.magicCardsService.findCardByScryfallId(enCard.id);
      if (!createdProductInBD) {
        throw new Error(
          `❌ No se encontró el producto en la base de datos para la carta: ${enCard.id} - ${enCard.name}`,
        );
      }
      //iterar por las variantes del producto
      for (const variantResponse of createdProduct.product.variants) {
        //separar la condición y el acabado de las opciones de la variante
        const condition = variantResponse.options.find(
          (option) => option.name === VariantOptionsEnum.CONDITION,
        )?.value;
        const finish = variantResponse.options.find(
          (option) => option.name === VariantOptionsEnum.FINISH,
        )?.value;

        let formatedFinish: string;
        switch (finish) {
          case 'No Foil':
            formatedFinish = 'nonfoil';
            break;
          case 'Foil':
            formatedFinish = 'foil';
            break;
          case 'Etched Foil':
            formatedFinish = 'etched';
            break;
          default:
            formatedFinish = finish;
            break;
        }

        const createdVariant = await this.magicCardsService.createVariantInApp(
          createdProductInBD,
          variantResponse,
          condition,
          formatedFinish,
        );

        //calcular el precio de la variante
        if (!createdVariant) {
          throw new Error(
            `❌ La respuesta de crear variante no contiene 'variant' para carta: ${enCard.id} - ${enCard.name}. Respuesta: ${JSON.stringify(variantResponse)}`,
          );
        }
        //TODO: AGREGAR RATE LIMIT O PROCESAR LUEGO DE QUE TERMINA TODO EL PROCESO DE CRECION DE VARIANTES
        await this.magicCardsService.calculatePrice(
          createdProduct.product.id,
          createdVariant.variantId,
        );
      }

      // Actualizar el ID de Jumpseller solo una vez por carta si hay versión en español
      if (esCard && thereIsSpanishVersion === true) {
        await this.magicCardsService.updateJumpsellerId(
          esCard.id,
          createdProduct.product.id,
        );
      }

      await job.updateProgress(100);
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
