import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ICreateImageRequest } from 'src/modules/jumpseller/interfaces/create-image.interface';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/addAnExistingCustomFieldToAProductRequest.interface';
import { JumpsellerProductRequest } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductRequest.interface';
import { JumpsellerCreateVariantRequest } from 'src/modules/jumpseller/interfaces/variants-jumpseller/JumpsellerCreateVariantRequest.interface';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { MagicCardDocument } from 'src/modules/magic/entities/magic-card.entity';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';
import { Language } from 'src/modules/magic/mappers/jumpseller.mapper.service';
import { EnumStatus } from 'src/modules/magic/enums/status.enum';
import { RequestTypeEnum } from '../enums/request-type.enum';
import { StagingProductVariantService } from 'src/modules/staging-product-variant/staging-product-variant.service';

@Processor('7-jumpseller-gateway', {
  concurrency: 15,
  limiter: { max: 15, duration: 1000 },
})
export class JumpsellerGatewayProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    private readonly jumpsellerService: JumpsellerService,
    private readonly stagingVariantsService: StagingProductVariantService
  ) {
    super();
  }
  async process(
    job: Job<
      {
        productRequest: JumpsellerProductRequest;
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
      productRequest,
      variantRequest,
      thereIsSpanishVersion,
      productId,
      customFieldRequest,
    } = job.data;
    try {
      switch (requestType) {
        case RequestTypeEnum.PRODUCTS:
          await job.updateProgress(5);
          const createdProduct =
            await this.magicCardsService.createProductJumpseller(
              productRequest,
            );
          await job.updateProgress(10);
          if (!createdProduct) {
            throw new Error(
              `Fallo al crear producto para carta con id: ${enCard.id}`,
            );
          }
          await this.magicCardsService.updateJumpsellerId(
            enCard.id,
            createdProduct.product.id,
          );
          await job.updateProgress(15);
          const isCreatedProduct =
            await this.magicCardsService.findCardByJumpsellerId(
              productId,
            );
          if (
            !isCreatedProduct &&
            isCreatedProduct.status !== EnumStatus.COMPLETED
          ) {
            throw new Error(
              `El producto con el id ${productId} no esta creado aún.`,
            );
          }

          break;
        case RequestTypeEnum.CUSTOM_FIELDS:
          if (!customFieldRequest || !createdProduct || !isCreatedProduct) {
            throw new Error(
              `Faltan datos para crear el campo personalizado en el producto con id: ${createdProduct.product.id}`,
            );
          }
          await this.jumpsellerService.addCustomFieldInProduct(
            createdProduct.product.id,
            customFieldRequest,
          );
          await job.updateProgress(75);
          break;
        case RequestTypeEnum.IMAGES:
          //enviar imagenes,
          if (!createdProduct || !imageRequest || !isCreatedProduct) {
            throw new Error(
              `Missing image data for product ID ${createdProduct.product.id}`,
            );
          }

          await this.jumpsellerService.insertImages(
            createdProduct.product.id,
            imageRequest,
          );
          break;
        case RequestTypeEnum.VARIANTS:
            if (!createdProduct || !variantRequest || !isCreatedProduct) {
            throw new Error(
              `Missing variant data for product ID ${createdProduct.product.id}`,
            );
          }
          const variantResponse = await this.magicCardsService.createJumpsellerVariant(
            createdProduct.product.id,
            variantRequest,
          );

          if (thereIsSpanishVersion && esCard) {
            await this.magicCardsService.updateJumpsellerId(
              esCard.id,
              createdProduct.product.id,
            );
          }
          const card = await this.magicCardsService.findCardByJumpsellerId(
            enCard.idJumpSeller,
          );
          //crear la variante en la base de datos
          await this.magicCardsService.createVariantInApp(
            card,
            variantResponse,
            variantRequest.condition,
            variantRequest.finish,
          );
          break;

        case RequestTypeEnum.PRICES:
          //consultar staging
         const stagingVariant = await this.stagingVariantsService.findByVariantId(
            variantResponse.variant.id,
          );
          if (!variantResponse.variant || !stagingVariant) {
            throw new Error(
              `Variant ID is missing for product ID ${createdProduct.product.id}`,
            );
          }
          await this.magicCardsService.calculatePrice(
            createdProduct.product.id,
            variantResponse.variant.id,
          );
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
