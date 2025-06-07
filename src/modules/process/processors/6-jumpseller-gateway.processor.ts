import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MagicCardsService } from 'src/modules/magic/magic-cards.service';

@Processor('6-jumpseller-gateway')
export class JumpsellerGatewayProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
  ) {
    super();
  }
  async process(job: Job<any, string, string>) {
    try {
      //centralizar aqui los envios a jumpseller
      //enviar productos
      // const createdProduct = await this.magicCardsService.createProductJumpseller(request);
      //enviar custom fields
      //TODO: ESTE ENDPOINT SOLO DEBE ENVIAR LOS CUSTOM FIELDS, CREAR OTRA FUNCION PARA PROCESAR Y PASAR A NUEVO JOB
      // await this.magicCardsService.processAndInsertCustomFields(job.data, response.product.id);
      //enviar imagenes, 
      // await this.magicCardsService.insertImages(response.product.id, image); //id del producto, imagen mapeada
      //enviar variantes
      const variantResponse = await this.magicCardsService.createJumpsellerVariant(
        job.data.productId, //id del producto
        job.data.variant //variante mapeada
      );
      //enviar precios
      //TODO: REFACTORIZAR PARA QUE ESTA FUNCION SOLO ENVIE LOS PRECIOS, CREAR OTRA FUNCION PARA PROCESAR Y PASAR A NUEVO JOB
      await this.magicCardsService.calculatePrice(job.data.productId, variantResponse.variant.id); //id del producto, id de la variante
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}