import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ICreateImageRequest } from 'src/modules/jumpseller/interfaces/create-image.interface';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/addAnExistingCustomFieldToAProductRequest.interface';
import { JumpsellerProductRequest } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductRequest.interface';
import { JumpsellerCreateVariantRequest } from 'src/modules/jumpseller/interfaces/variants-jumpseller/JumpsellerCreateVariantRequest.interface';
import { JumpsellerService } from 'src/modules/jumpseller/jumpseller.service';
import { MagicCardDocument } from 'src/modules/magic/entities/magic-card.entity';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';
import { CustomFieldsMapperService } from 'src/modules/magic/mappers/jumpseller.customfields.mapper.service';
import { Language } from 'src/modules/magic/mappers/jumpseller.mapper.service';

@Processor('7-jumpseller-gateway')
export class JumpsellerGatewayProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    private readonly jumpsellerService: JumpsellerService,
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
      const createdProduct = await this.magicCardsService.createProductJumpseller(job.data.productRequest);
      //actualizar el id de jumpseller en la carta
      await job.updateProgress(10);
      await this.magicCardsService.updateJumpsellerId(job.data.enCard.id, createdProduct.product.id); //hacer lo mismo con la version en español
      if (job.data.thereIsSpanishVersion && job.data.esCard) {
        await this.magicCardsService.updateJumpsellerId(job.data.esCard.id, createdProduct.product.id);
      }
      await job.updateProgress(15);
      //enviar variantes
      const variantResponse = await this.magicCardsService.createJumpsellerVariant(
        createdProduct.product.id,
        job.data.variantRequest
      );
      await job.updateProgress(20);
      
      //actualizar el id de jumpseller en la variante
      if (job.data.thereIsSpanishVersion && job.data.esCard) {
        await this.magicCardsService.updateJumpsellerId(
          job.data.esCard.id,
          createdProduct.product.id
        );
      }
      await job.updateProgress(25);
      
      const card = await this.magicCardsService.findCardByJumpsellerId(job.data.productId)
      //crear la variante en la base de datos
      await this.magicCardsService.createVariantInApp(card, variantResponse, job.data.variantRequest.condition, job.data.variantRequest.finish);
      await job.updateProgress(30);
      
      //enviar custom fields
      await this.jumpsellerService.addCustomFieldInProduct(job.data.customFieldCard.idJumpSeller, job.data.customFieldRequest);
      await job.updateProgress(35);
      
      //enviar imagenes, 
      await this.jumpsellerService.insertImages(job.data.imageProductId, job.data.image);
      await job.updateProgress(40);
      //enviar precios
      
      // //calcular el precio de la variante TODO: REFACTORIZAR Y MOVER A UN JOB INDEPENDIENTE
      // await this.magicCardsService.calculatePrice(job.data.productId, variantDb.variantId);

      //TODO: REFACTORIZAR PARA QUE ESTA FUNCION SOLO ENVIE LOS PRECIOS, CREAR OTRA FUNCION PARA PROCESAR Y PASAR A NUEVO JOB
      // await this.magicCardsService.calculatePrice(job.data.enCard.idJumpSeller, variantResponse.variant.id); //id del producto, id de la variante
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}