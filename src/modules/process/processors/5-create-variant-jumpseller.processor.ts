import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { MagicCardsService } from '../../magic/magic-cards.service';
import {
  JumpsellerCreateVariantRequest
} from '../../jumpseller/interfaces/variants-jumpseller/JumpsellerCreateVariantRequest.interface';

@Processor('5-create-variant-jumpseller')
export class CreateVariantJumpsellerProcessor extends WorkerHost {
  constructor( private readonly magicCardsService: MagicCardsService) {
    super();
  }
  async process(job: Job<{ variant: JumpsellerCreateVariantRequest, productId: number}, string, string>) {
    try {
      const variantResponse = await this.magicCardsService.createJumpsellerVariant(
        job.data.productId,
        job.data.variant
      );
      const card = await this.magicCardsService.findCardByJumpsellerId(job.data.productId)
      const variantDb = await this.magicCardsService.createVariantInApp(card, variantResponse, job.data.variant.condition, job.data.variant.finish);
      await this.magicCardsService.calculatePrice(job.data.productId, variantDb.variantId);
      return variantDb._id;
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}