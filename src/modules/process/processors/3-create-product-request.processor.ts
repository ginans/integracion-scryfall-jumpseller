import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { JumpsellerProductRequest } from 'src/modules/jumpseller/interfaces/jumpsellerProducts/jumpsellerCreateProductRequest.interface';

@Processor('3-create-product-request')
export class CreateProductRequestProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue("6-jumpseller-gateway") private readonly jumpsellerGatewayQueue: Queue<{productRequest: JumpsellerProductRequest}, string, string>
  ) {
    super();
  }

  //TODO: ESTE JOB SOLO DEBE PROCESAR el mapeo DEL PRODUCTO EN JUMPSELLER, DEBE SER UN JOB INDEPENDIENTE
  async process(job: Job<{enCard: MagicCardDocument, esCard: MagicCardDocument | null, thereIsSpanishVersion: boolean}, number, string>) {
    try {
      //pregunta si existe la carta en español, si existe le pasa el nombre en español
      await job.updateProgress(25);
      let descriptions: string[] = [];
      if (job.data.esCard && job.data.thereIsSpanishVersion === true) {
        const lang = await this.magicCardsService.translatedLanguages(job.data.esCard.lang);
        descriptions.push(`Nombre en ${lang}: ${job.data.esCard.printedName}.`);
      }
      await job.updateProgress(50);
      //mapea la carta a un formato que Jumpseller entienda como producto
      const request = await this.magicCardsService.mapCardData(job.data.enCard, descriptions);
      //jumpseller gateway
      await this.jumpsellerGatewayQueue.add(
        "create-product", //nombre del job 
        { productRequest: request }) //data
      await job.updateProgress(100);
      return "Product request created successfully";
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}