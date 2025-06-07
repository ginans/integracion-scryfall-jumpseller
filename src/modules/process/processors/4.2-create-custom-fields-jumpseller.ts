import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { ILangUrlEnum } from '../../magic/submodules/scryfall/enums/lang.enum';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { EnumLanguage } from '../../magic/enums/lang.enum';
import { Language } from '../../magic/mappers/jumpseller.mapper.service';

@Processor('3-create-product-jumpseller')
export class CreateProductJumpsellerProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    @InjectQueue('4-create-variants-request') private readonly checkVariantsQueue: Queue
  ) {
    super();
  }

  //TODO: ESTE JOB SOLO DEBE PROCESAR LA CREACION DEL PRODUCTO EN JUMPSELLER, DEBE SER UN JOB INDEPENDIENTE
  async process(job: Job<MagicCardDocument, number, string>) {
    try {
      /**
       * Cargar Custom Fields
       */
      await job.updateProgress(100);
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}