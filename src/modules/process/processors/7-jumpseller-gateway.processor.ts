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
        enCard: MagicCardDocument;
        esCard?: MagicCardDocument | null;
        thereIsSpanishVersion: boolean;
        variantRequest: JumpsellerCreateVariantRequest;
        lang: Language[];
        productId: number;
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
      
      //jumpseller gateway
      const createdProduct =
        await this.magicCardsService.createProductJumpseller(
          mappedEnProductToJumpseller,
        );
      await job.updateProgress(10);

      // Validar que el producto se creó correctamente
      if (
        !createdProduct ||
        !createdProduct.product ||
        !createdProduct.product.id
      ) {
        throw new Error(
          `Fallo al crear producto para carta con id: ${job.data.enCard.id} y nombre: ${job.data.enCard.printedName}.`,
        );
      }

      // Actualizar el ID de Jumpseller en la base de datos
      await this.magicCardsService.updateJumpsellerId(
        job.data.enCard.id,
        createdProduct.product.id,
      );

      // Verificar que el producto se guardó correctamente en la BD
      const isCreatedProduct =
        await this.magicCardsService.findCardByJumpsellerId(
          createdProduct.product.id,
        );
      if (
        !isCreatedProduct ||
        isCreatedProduct.status !== EnumStatus.COMPLETED
      ) {
        throw new Error(
          `El producto con el id ${createdProduct.product.id} no se guardó correctamente en la base de datos.`,
        );
      } // Solo continuar con las demás operaciones si el producto se creó exitosamente
      await job.updateProgress(10);
      // Variable para almacenar la respuesta de variante (si aplica)
      let variantResponse: any = null;
      switch (requestType) {
        case RequestTypeEnum.PRODUCTS:
          // Solo crear el producto (ya se hizo arriba)
          await job.updateProgress(75);
          console.log(
            `Producto creado exitosamente con ID: ${createdProduct.product.id}`,
          );
          break;

        case RequestTypeEnum.CUSTOM_FIELDS:
          await job.updateProgress(20);
          if (customFieldRequest) {
            await job.updateProgress(40);
            await this.jumpsellerService.addCustomFieldInProduct(
              createdProduct.product.id,
              customFieldRequest,
            );
            await job.updateProgress(75);
          } else {
            throw new Error(
              `Faltan datos para crear el campo personalizado en el producto con id: ${createdProduct.product.id}`,
            );
          }
          break;

        case RequestTypeEnum.IMAGES:
          await job.updateProgress(20);
          if (!imageRequest) {
            throw new Error(
              `Missing image data for product ID ${createdProduct.product.id}`,
            );
          }
          await job.updateProgress(40);
          await this.jumpsellerService.insertImages(
            createdProduct.product.id,
            imageRequest,
          );
          await job.updateProgress(75);
          break;

        case RequestTypeEnum.VARIANTS:
          await job.updateProgress(20);
          if (!variantRequest) {
            throw new Error(
              `Missing variant data for product ID ${createdProduct.product.id}`,
            );
          }
          await job.updateProgress(30);

          variantResponse =
            await this.magicCardsService.createJumpsellerVariant(
              createdProduct.product.id,
              variantRequest,
            );
          await job.updateProgress(45);

          if (thereIsSpanishVersion && esCard && variantResponse) {
            await this.magicCardsService.updateJumpsellerId(
              esCard.id,
              createdProduct.product.id,
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
          await job.updateProgress(20);
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
                `Variant ID is missing for product ID ${createdProduct.product.id}`,
              );
            }
            await job.updateProgress(65);

            await this.magicCardsService.calculatePrice(
              createdProduct.product.id,
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
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
