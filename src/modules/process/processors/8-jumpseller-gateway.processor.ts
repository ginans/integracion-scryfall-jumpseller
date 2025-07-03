import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { ICreateImageRequest } from 'src/modules/jumpseller/interfaces/create-image.interface';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/addAnExistingCustomFieldToAProductRequest.interface';
import { JumpsellerCreateVariantRequestForBD } from 'src/modules/jumpseller/interfaces/variants-jumpseller/JumpsellerCreateVariantRequest.interface';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { MagicCardDocument } from 'src/modules/magic/entities/magic-card.entity';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';
import { RequestTypeEnum } from '../enums/request-type.enum';
import { JumpsellerProductRequest } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductRequest.interface';
import { JumpsellerProductResponse } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductResponse.interface';
import { Language } from 'src/modules/magic/mappers/jumpseller.mapper.service';

@Processor('8-jumpseller-gateway', {
  concurrency: 15,
  limiter: { max: 15, duration: 1000 },
})
export class JumpsellerGatewayProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    private readonly jumpsellerService: JumpsellerService,
    @InjectQueue('7-jumpseller-request-coordinator')
    private readonly JumpsellerRequestCoordinatorQueue: Queue<
      {
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
        productId: number;
        thereIsSpanishVersion: boolean;
        lang?: Language[];
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
        enCard?: MagicCardDocument; //siempre viene sin idJumpSeller
        esCard?: MagicCardDocument | null; //siempre viene sin idJumpSeller
        body:
          | JumpsellerProductRequest
          | JumpsellerCreateVariantRequestForBD
          | ICreateImageRequest
          | AddAnExistingCustomFieldToAProductRequest;
        requestType: RequestTypeEnum;
        thereIsSpanishVersion?: boolean;
        productId?: number;
        lang?: Language[];
      },
      string,
      string
    >,
  ) {
    const {
      body,
      requestType,
      enCard,
      esCard,
      thereIsSpanishVersion,
      productId,
      lang,
    } = job.data;

    try {
      switch (requestType) {
        case RequestTypeEnum.PRODUCTS:
          const createdProduct: JumpsellerProductResponse =
            await this.magicCardsService.createProductJumpseller(
              body as JumpsellerProductRequest,
            );
          // Validar que el producto se creó correctamente
          if (!createdProduct) {
            throw new Error(
              `❌ El servicio createProductJumpseller devolvió undefined/null para carta: ${enCard.id} - ${enCard.printedName}`,
            );
          }

          // Actualizar el ID de Jumpseller en la base de datos
          await this.magicCardsService.updateJumpsellerId(
            enCard.id,
            createdProduct.product.id,
          );

          //enviar al job 7
          await this.JumpsellerRequestCoordinatorQueue.add(
            `Coordinator Job`, //nombre del job
            {
              enCard: enCard,
              esCard: esCard || null,
              thereIsSpanishVersion: thereIsSpanishVersion,
              productId: createdProduct.product.id,
              lang: lang,
            },
            {
              delay: 500,
              attempts: 5,
              backoff: {
                type: 'exponential',
                delay: 1000,
              },
            },
          );
          break;
        case RequestTypeEnum.CUSTOM_FIELDS:
          const requestTypeCustomFields =
            body as AddAnExistingCustomFieldToAProductRequest;
          if (requestTypeCustomFields) {
            const response =
              await this.jumpsellerService.addCustomFieldInProduct(
                productId,
                requestTypeCustomFields,
              );
            //delay parche
            await new Promise((resolve) => setTimeout(resolve, 300));
            if (!response.product) {
              throw new Error(
                `❌ No se pudo enviar el custom field ${enCard.id} - ${enCard.name}. Respuesta: ${JSON.stringify(response)}`,
              );
            }
          } else {
            throw new Error(
              `Faltan datos para crear el campo personalizado en el producto con id: ${productId}`,
            );
          }
          break;

        case RequestTypeEnum.IMAGES:
          if (!(body as ICreateImageRequest)) {
            throw new Error(`Missing image data for product ID ${productId}`);
          }
          const imageRequest = body as ICreateImageRequest;
          const imageResponse = await this.jumpsellerService.insertImages(
            productId,
            imageRequest,
          );
          if (!imageResponse) {
            throw new Error(
              `❌ No se pudo enviar la imagen ${enCard.id} - ${enCard.name}. Respuesta: ${JSON.stringify(imageResponse)}`,
            );
          }
          break;

        case RequestTypeEnum.VARIANTS:
          const { variant, condition, finish } =
            body as JumpsellerCreateVariantRequestForBD;

          if (!variant || !variant.sku) {
            throw new Error(`Missing variant data for product ID ${productId}`);
          }
          const variantResponse =
            await this.magicCardsService.createJumpsellerVariant(productId, {
              variant: variant,
            });

          if (esCard && thereIsSpanishVersion === true && variantResponse) {
            await this.magicCardsService.updateJumpsellerId(
              esCard.id,
              productId,
            );
          }
          //crear la variante en la base de datos
          if (!variantResponse) {
            throw new Error(
              `❌ La respuesta de crear variante no contiene 'variant' para carta: ${enCard.id} - ${enCard.name}. Respuesta: ${JSON.stringify(variantResponse)}`,
            );
          }

          const createdProductInBD =
            await this.magicCardsService.findCardByScryfallId(enCard.id);
          if (!createdProductInBD) {
            throw new Error(
              `❌ No se encontró el producto en la base de datos para la carta: ${enCard.id} - ${enCard.name}`,
            );
          }
          await this.magicCardsService.createVariantInApp(
            createdProductInBD,
            variantResponse,
            condition,
            finish,
          );

          await this.magicCardsService.calculatePrice(
            productId,
            variantResponse.variant.id,
          );
          break;

        default:
          console.log('Tipo de solicitud no reconocido:', requestType);
          throw new Error(
            `Tipo de solicitud no reconocido: ${job.data.requestType}`,
          );
      }
      await job.updateProgress(100);
    } catch (error) {
      console.error(
        `❌ Error en JumpsellerGatewayProcessor para carta ${enCard?.id}:`,
        error,
      );
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
