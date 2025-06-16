import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ICreateImageRequest } from 'src/modules/jumpseller/interfaces/create-image.interface';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/addAnExistingCustomFieldToAProductRequest.interface';
import { JumpsellerCreateVariantRequest } from 'src/modules/jumpseller/interfaces/variants-jumpseller/JumpsellerCreateVariantRequest.interface';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { MagicCardDocument } from 'src/modules/magic/entities/magic-card.entity';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';
import { Language } from 'src/modules/magic/mappers/jumpseller.mapper.service';
import { RequestTypeEnum } from '../enums/request-type.enum';
import { StagingProductVariantService } from 'src/modules/staging-product-variant/staging-product-variant.service';
import { EnumStatus } from 'src/modules/magic/enums/status.enum';
import { JumpsellerProductRequest } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductRequest.interface';
import { JumpsellerProductResponse } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductResponse.interface';

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
        enCard: MagicCardDocument;//siempre viene sin idJumpSeller
        esCard?: MagicCardDocument | null; //siempre viene sin idJumpSeller
        thereIsSpanishVersion: boolean;
        variantRequest: JumpsellerCreateVariantRequest;
        imageRequest: ICreateImageRequest;
        customFieldCard: MagicCardDocument;
        customFieldRequest: AddAnExistingCustomFieldToAProductRequest;
        requestType: RequestTypeEnum;
        mappedEnProductToJumpseller: JumpsellerProductRequest;
      },
      string,
      string
    >,
  ) {
    const {
      requestType,
      enCard,
      esCard,
      imageRequest,
      variantRequest,
      thereIsSpanishVersion,
      customFieldRequest,
      mappedEnProductToJumpseller,
    } = job.data;

    try {
      // Validación temprana de datos críticos
      console.log(`🔧 Debugging datos del job:`, {
        requestType,
        hasEnCard: !!enCard,
        enCardId: enCard?.id,
        enCardName: enCard?.printedName,
        hasEsCard: !!esCard,
        hasMappedProduct: !!mappedEnProductToJumpseller,
        hasImageRequest: !!imageRequest,
        hasVariantRequest: !!variantRequest,
        hasCustomFieldRequest: !!customFieldRequest,
      });

      // Validar que enCard existe
      if (!enCard || !enCard.id) {
        throw new Error(
          `Datos de la carta en inglés faltantes o inválidos. enCard: ${JSON.stringify(enCard)}`,
        );
      }

      
      console.log(`📋 RequestType: ${requestType}`); // Verificar si ya existe un producto en Jumpseller para esta carta
      let createdProduct: JumpsellerProductResponse = null;
      let productId: number | null = null;
     
        // Solo crear producto si no existe y si tenemos los datos mapeados
        if (!mappedEnProductToJumpseller) {
          throw new Error(
            `Datos del producto no mapeados para carta con id: ${enCard.id} y nombre: ${enCard.printedName}`,
          );
        }

        console.log(
          `📦 Datos del producto mapeado:`,
          JSON.stringify(mappedEnProductToJumpseller, null, 2),
        );

        //jumpseller gateway
        createdProduct = await this.magicCardsService.createProductJumpseller(
          mappedEnProductToJumpseller,
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

        productId = createdProduct.product.id;

        // Actualizar el ID de Jumpseller en la base de datos solo si es nuevo
        await this.magicCardsService.updateJumpsellerId(enCard.id, productId);
      

      await job.updateProgress(10);

      // Verificar que el producto existe en la BD
      const isCreatedProduct =
        await this.magicCardsService.findCardByJumpsellerId(productId);
      if (
        !isCreatedProduct ||
        isCreatedProduct.status !== EnumStatus.COMPLETED
      ) {
        throw new Error(
          `El producto con el id ${productId} no se guardó correctamente en la base de datos.`,
        );
      }

      // Solo continuar con las demás operaciones si el producto está disponible
      await job.updateProgress(20);

      // Variable para almacenar la respuesta de variante (si aplica)
      let variantResponse: any = null;

      switch (requestType) {
        case RequestTypeEnum.PRODUCTS:
          // Solo crear el producto (ya se hizo arriba)
          await job.updateProgress(75);
          console.log(`Producto creado exitosamente con ID: ${productId}`);
          break;
        case RequestTypeEnum.CUSTOM_FIELDS:
          await job.updateProgress(30);
          if (customFieldRequest) {
            await job.updateProgress(40);
            await this.jumpsellerService.addCustomFieldInProduct(
              productId,
              customFieldRequest,
            );
            await job.updateProgress(75);
          } else {
            throw new Error(
              `Faltan datos para crear el campo personalizado en el producto con id: ${productId}`,
            );
          }
          break;

        case RequestTypeEnum.IMAGES:
          await job.updateProgress(30);
          if (!imageRequest) {
            throw new Error(`Missing image data for product ID ${productId}`);
          }
          await job.updateProgress(40);
          await this.jumpsellerService.insertImages(productId, imageRequest);
          await job.updateProgress(75);
          break;

        case RequestTypeEnum.VARIANTS:
          await job.updateProgress(30);
          if (!variantRequest) {
            throw new Error(`Missing variant data for product ID ${productId}`);
          }
          await job.updateProgress(40);

          variantResponse =
            await this.magicCardsService.createJumpsellerVariant(
              productId,
              variantRequest,
            );
          await job.updateProgress(50);

          if (thereIsSpanishVersion && esCard && variantResponse) {
            await this.magicCardsService.updateJumpsellerId(
              esCard.id,
              productId,
            );
            await job.updateProgress(55);
          }

          const card = await this.magicCardsService.findCardByJumpsellerId(
            enCard.idJumpSeller,
          );
          await job.updateProgress(65);

          //crear la variante en la base de datos
          await this.magicCardsService.createVariantInApp(
            card,
            variantResponse,
            variantRequest.condition,
            variantRequest.finish,
          );
          await job.updateProgress(75);
          break;
        case RequestTypeEnum.PRICES:
          await job.updateProgress(30);
          if (variantResponse) {
            await job.updateProgress(35);
            //consultar staging
            const stagingVariant =
              await this.stagingVariantsService.findByVariantId(
                variantResponse.variant.id,
              );
            await job.updateProgress(50);

            if (!variantResponse.variant || !stagingVariant) {
              throw new Error(
                `Variant ID is missing for product ID ${productId}`,
              );
            }
            await job.updateProgress(65);

            await this.magicCardsService.calculatePrice(
              productId,
              variantResponse.variant.id,
            );
            await job.updateProgress(75);
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
      console.error(`📊 Datos del job:`, {
        requestType,
        enCardId: enCard?.id,
        enCardName: enCard?.printedName,
        hasMappedProduct: !!mappedEnProductToJumpseller,
      });
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
