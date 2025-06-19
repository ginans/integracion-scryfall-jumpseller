import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ICreateImageRequest } from 'src/modules/jumpseller/interfaces/create-image.interface';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/addAnExistingCustomFieldToAProductRequest.interface';
import {
  JumpsellerCreateVariantRequestForBD,
} from 'src/modules/jumpseller/interfaces/variants-jumpseller/JumpsellerCreateVariantRequest.interface';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { MagicCardDocument } from 'src/modules/magic/entities/magic-card.entity';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';
import { RequestTypeEnum } from '../enums/request-type.enum';
import { StagingProductVariantService } from 'src/modules/staging-product-variant/staging-product-variant.service';
import { JumpsellerProductRequest } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductRequest.interface';
import { JumpsellerProductResponse } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductResponse.interface';
import { JumpsellerCreateVariantResponse } from 'src/modules/jumpseller/interfaces/variants-jumpseller/jumpsellerCreateVariantResponse.interface';
import { IStagingProductVariant } from 'src/modules/staging-product-variant/interfaces/stagingProductVariant.interface';

@Processor('7-jumpseller-gateway', {
  concurrency: 15,
  limiter: { max: 15, duration: 1000 },
})
export class JumpsellerGatewayProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    private readonly jumpsellerService: JumpsellerService,
    private readonly stagingVariantsService: StagingProductVariantService,
  ) {
    super();
  }
  async process(
    job: Job<
      {
        enCard: MagicCardDocument; //siempre viene sin idJumpSeller
        esCard?: MagicCardDocument | null; //siempre viene sin idJumpSeller
        thereIsSpanishVersion: boolean;
        body: JumpsellerProductRequest | JumpsellerCreateVariantRequestForBD | ICreateImageRequest | AddAnExistingCustomFieldToAProductRequest;
        requestType: RequestTypeEnum;
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
    } = job.data;

    try {
      // Validación temprana de datos críticos
      console.log(`🔧 Debugging datos del job:`, {
        requestType,
        hasEnCard: !!enCard,
        enCardId: enCard?.id,
        enCardName: enCard?.name,
        hasEsCard: !!esCard
      });
      console.log(`
        POZOLES EN JOB FINAL PARA CARD: ${enCard?.id} - ${enCard?.name}
        -- Datos del job ---  
        ✨✨✨✨✨✨✨✨✨
        🔍 RequestType: ${requestType}
        body: ${JSON.stringify(job.data.body)}
        `);

      // Validar que enCard existe
      if (!enCard || !enCard.id) {
        throw new Error(
          `Datos de la carta en inglés faltantes o inválidos. enCard: ${JSON.stringify(enCard)}`,
        );
      }

      console.log(`📋 RequestType: ${requestType}`);
     //consular id de jumpseller en bd
     let productId: number | null = null;
     let createdProduct: JumpsellerProductResponse | null = null;
     let createdProductInBD: MagicCardDocument | null = null;
     let variantCreatedInBD: IStagingProductVariant | null = null;
     if (requestType !== RequestTypeEnum.PRODUCTS) {
         createdProductInBD = await this.magicCardsService.findCardByScryfallId(enCard.id);
         productId = createdProductInBD?.idJumpSeller || null;
     }

      let variantResponse: JumpsellerCreateVariantResponse = null;
      
      switch (requestType) {
        case RequestTypeEnum.PRODUCTS:
          createdProduct = await this.magicCardsService.createProductJumpseller(
            body as JumpsellerProductRequest,
          );
    
          // Validar que el producto se creó correctamente
          if (!createdProduct) {
            throw new Error(
              `❌ El servicio createProductJumpseller devolvió undefined/null para carta: ${enCard.id} - ${enCard.printedName}`,
            );
          }
    
          if (!createdProduct.product) {
            throw new Error(
              `❌ La respuesta no contiene la propiedad 'product' para carta: ${enCard.id} - ${enCard.printedName}. Respuesta: ${JSON.stringify(createdProduct)}`,
            );
          }
    
          if (!createdProduct.product.id) {
            throw new Error(
              `❌ El producto creado no tiene ID para carta: ${enCard.id} - ${enCard.printedName}. Producto: ${JSON.stringify(createdProduct.product)}`,
            );
          }
          // Actualizar el ID de Jumpseller en la base de datos solo si es nuevo
          await this.magicCardsService.updateJumpsellerId(enCard.id, createdProduct.product.id);
          break;
        case RequestTypeEnum.CUSTOM_FIELDS:
          if (body as AddAnExistingCustomFieldToAProductRequest) {
            await this.jumpsellerService.addCustomFieldInProduct(
              productId,
              body as AddAnExistingCustomFieldToAProductRequest,
            );
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
          await this.jumpsellerService.insertImages(productId, body as ICreateImageRequest);
          break;

        case RequestTypeEnum.VARIANTS:
          const { variant, condition, finish } = body as JumpsellerCreateVariantRequestForBD;

          if (!variant || !variant.sku) {
            throw new Error(`Missing variant data for product ID ${productId}`);
          }

          variantResponse =
            await this.magicCardsService.createJumpsellerVariant(
              productId,
              { variant: variant },
            );

          if (thereIsSpanishVersion && esCard && variantResponse) {
            await this.magicCardsService.updateJumpsellerId(
              esCard.id,
              productId,
            );
      
          }
          //crear la variante en la base de datos
    
          if (!variantResponse || !variantResponse.variant) {
            throw new Error(`❌ La respuesta de crear variante no contiene 'variant' para carta: ${enCard.id} - ${enCard.printedName}. Respuesta: ${JSON.stringify(variantResponse)}`);
          }
          await this.magicCardsService.createVariantInApp(
            createdProductInBD,
            variantResponse,
            condition,
            finish,
          );
          break;
        case RequestTypeEnum.PRICES:
          if (variantCreatedInBD) {
            //consultar staging
            const stagingVariant =
              await this.stagingVariantsService.findByVariantId(
                variantCreatedInBD.variantId
              );

            if (!variantCreatedInBD || !stagingVariant) {
              throw new Error(
                `Variant ID is missing for product ID ${productId}`,
              );
            }

            await this.magicCardsService.calculatePrice(
              productId,
              variantCreatedInBD.variantId,
            );
          }
          break;

        default:
          console.log('Tipo de solicitud no reconocido:', requestType);
          throw new Error(`Tipo de solicitud no reconocido: ${requestType}`);
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
