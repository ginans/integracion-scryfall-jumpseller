import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { JumpsellerProductRequest } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerCreateProductRequest.interface';
import { JumpsellerVariant } from 'src/modules/jumpseller/interfaces/products-jumpseller/jumpsellerGetAllProduct.interface';
import { JumpsellerCreateVariantRequest } from 'src/modules/jumpseller/interfaces/variants-jumpseller/JumpsellerCreateVariantRequest.interface';
import { MagicCardDocument } from 'src/modules/magic/entities/magic-card.entity';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';

@Processor('6-jumpseller-gateway')
export class JumpsellerGatewayProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
  ) {
    super();
  }
  async process(job: Job<{
    productRequest: JumpsellerProductRequest, 
    enCard: MagicCardDocument, 
    thereIsSpanishVersion: boolean,
    mappedVariant: JumpsellerCreateVariantRequest
  }, string, string>) {
    try {
      //centralizar aqui los envios a jumpseller
      //enviar productos
      const createdProduct = await this.magicCardsService.createProductJumpseller(job.data.productRequest);
      //actualizar el id de jumpseller en la carta
      await this.magicCardsService.updateJumpsellerId(job.data.enCard.id, createdProduct.product.id); //hacer lo mismo con la version en español
      if (job.data.thereIsSpanishVersion) {
        //TODO:ver como reconocer la version en español
        await this.magicCardsService.updateJumpsellerId(job.data.enCard.id, createdProduct.product.id);
      }
      //enviar variantes
      const variantResponse = await this.magicCardsService.createJumpsellerVariant(
        createdProduct.product.id, //id del producto
        job.data.mappedVariant //variante mapeada
      );
     
      //enviar custom fields

      //TODO: ESTE ENDPOINT SOLO DEBE ENVIAR LOS CUSTOM FIELDS, CREAR OTRA FUNCION PARA PROCESAR Y PASAR A NUEVO JOB
      // await this.magicCardsService.processAndInsertCustomFields(job.data, response.product.id);
     
      //enviar imagenes, 
     
      // await this.magicCardsService.insertImages(response.product.id, image); //id del producto, imagen mapeada
     
      //enviar precios
     
      //TODO: REFACTORIZAR PARA QUE ESTA FUNCION SOLO ENVIE LOS PRECIOS, CREAR OTRA FUNCION PARA PROCESAR Y PASAR A NUEVO JOB
      await this.magicCardsService.calculatePrice(job.data.enCard.idJumpSeller, variantResponse.variant.id); //id del producto, id de la variante
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}