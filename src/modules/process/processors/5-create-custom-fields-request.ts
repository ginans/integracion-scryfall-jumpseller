import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { CustomFieldsMapperService } from 'src/modules/magic/mappers/jumpseller.customfields.mapper.service';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/addAnExistingCustomFieldToAProductRequest.interface';

@Processor('5-create-custom-fields-request', { concurrency: 80 })
export class CreateCustomFieldsRequestProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    private readonly customFieldsMapperService: CustomFieldsMapperService,
    @InjectQueue("7-jumpseller-gateway") 
    private readonly jumpsellerGatewayQueue: Queue<{
    card: MagicCardDocument,  
    customFieldRequest: AddAnExistingCustomFieldToAProductRequest, 
    }, string, string>
    ) {
    super();
  }

  async process(job: Job<MagicCardDocument, number, string>) {
    try {
      const fetchedCustomFields = await this.magicCardsService.getAllCustomFields();
      if (!fetchedCustomFields || fetchedCustomFields.length === 0) return;
      const requestsCustomFields = await this.customFieldsMapperService.mappedCustomFields(job.data, fetchedCustomFields);
      for (const customField of requestsCustomFields) {
        try {
          await this.jumpsellerGatewayQueue.add('add-custom-field', {
            card: job.data,
            customFieldRequest: customField,
          });
        } catch (error) {
         throw new Error(`❌ Error al subir custom field: ${error.message}`);
        }
      }
      await job.updateProgress(100);
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}