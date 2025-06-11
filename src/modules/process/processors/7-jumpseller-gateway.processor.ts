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
import { JumpsellerRateLimiterService } from '../jumpseller-rate-limiter.service';
import { EnumStatus } from 'src/modules/magic/enums/status.enum';

@Processor('7-jumpseller-gateway', { concurrency: 80 })
export class JumpsellerGatewayProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    private readonly jumpsellerService: JumpsellerService,
    private readonly rateLimiter: JumpsellerRateLimiterService,
  ) {
    super();
  }
  async process(job: Job<{
    productRequest: JumpsellerProductRequest, 
    enCard: MagicCardDocument, 
    esCard?: MagicCardDocument | null, 
    thereIsSpanishVersion: boolean,
    variantRequest: JumpsellerCreateVariantRequest,
    lang: Language[], 
    productId: number,
    imageProductId: number,
    image: ICreateImageRequest,
    customFieldCard: MagicCardDocument,
    customFieldRequest: AddAnExistingCustomFieldToAProductRequest
  }, string, string>) {
    try {
      //centralizar aqui los envios a jumpseller
      //enviar productos
      await job.updateProgress(5);
   
     const createdProduct = await this.rateLimiter.schedule(() => 
        this.magicCardsService.createProductJumpseller(job.data.productRequest),
        { id: `create-product-${job.data.enCard.id}` }
      );
      //actualizar el id de jumpseller en la carta
      await job.updateProgress(10);
      if (!createdProduct){
        throw new Error(`Fallo al crear producto para carta con id: ${job.data.enCard.id}`);
      }
      await this.magicCardsService.updateJumpsellerId(job.data.enCard.id, createdProduct.product.id);
      await job.updateProgress(15);
      //enviar variantes

      const isCreatedProduct = await this.magicCardsService.findCardByJumpsellerId(job.data.productId);

      if (!isCreatedProduct && isCreatedProduct.status !== EnumStatus.COMPLETED) {
        throw new Error(`El producto con el id ${job.data.productId} no esta creado aún.`);
      }
      const variantResponse = await this.rateLimiter.schedule(() => 
        this.magicCardsService.createJumpsellerVariant(
          createdProduct.product.id,
          job.data.variantRequest
        ),
          { id: `create-variant-${job.data.enCard.id}` }
      );
      await job.updateProgress(20);
      
      if (job.data.thereIsSpanishVersion && job.data.esCard) {
        await this.magicCardsService.updateJumpsellerId(job.data.esCard.id, createdProduct.product.id);
      }
      
      await job.updateProgress(25);

      const card = await this.magicCardsService.findCardByJumpsellerId(job.data.productId);
      //crear la variante en la base de datos
      await this.magicCardsService.createVariantInApp(card, variantResponse, job.data.variantRequest.condition, job.data.variantRequest.finish);
      await job.updateProgress(30);
      
      //enviar custom fields
      await this.rateLimiter.schedule(() => 
        this.jumpsellerService.addCustomFieldInProduct(job.data.customFieldCard.idJumpSeller, job.data.customFieldRequest),
        { id: `add-custom-field-${job.data.customFieldCard.id}` }
      );
      await job.updateProgress(35);

      //enviar imagenes, 
      if (!job.data.imageProductId || !job.data.image) {
        throw new Error(`Missing image data for product ID ${createdProduct.product.id}`);
      }

      await this.rateLimiter.schedule(() =>
        this.jumpsellerService.insertImages(job.data.imageProductId, job.data.image),
        { id: `insert-images-${job.data.imageProductId}` }
      );
      await job.updateProgress(40);
      //enviar precios
      
      //calcular el precio de la variante TODO: REFACTORIZAR Y MOVER A UN JOB INDEPENDIENTE
      if (!variantResponse.variant || !variantResponse.variant.id) {
        throw new Error(`Variant ID is missing for product ID ${createdProduct.product.id}`);
      }
      await this.rateLimiter.schedule(() =>
        this.magicCardsService.calculatePrice(createdProduct.product.id, variantResponse.variant.id),
        { id: `calculate-price-${createdProduct.product.id}-${variantResponse.variant.id}` }
      );

    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}