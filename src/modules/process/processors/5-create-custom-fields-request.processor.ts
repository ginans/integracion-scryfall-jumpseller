import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { CustomFieldsMapperService } from 'src/modules/magic/mappers/jumpseller.customfields.mapper.service';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/addAnExistingCustomFieldToAProductRequest.interface';
import { RequestTypeEnum } from '../enums/request-type.enum';
import { RateLimiterService } from 'src/common/services/rate-limiter.service';
import { JumpsellerCustomField } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/getAllCustomFields.interface';
import { createCustomFieldRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/createCustomfieldRequest.interface';
import { MapCFCollection } from 'src/modules/jumpseller/interfaces/map-CF-collection.interface';

@Processor('5-create-custom-fields-request', { concurrency: 40 })
export class CreateCustomFieldsRequestProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    private readonly customFieldsMapperService: CustomFieldsMapperService,
    @InjectQueue('8-jumpseller-gateway')
    private readonly jumpsellerGatewayQueue: Queue<
      {
        requestType: RequestTypeEnum;
        body: AddAnExistingCustomFieldToAProductRequest;
        productId: number;
      },
      string,
      string
    >,
  ) {
    super();
  }
  async process(
    job: Job<
      {
        enCard: MagicCardDocument;
        productId: number;
      },
      number,
      string
    >,
  ) {
    try {
      const { enCard, productId } = job.data;


     
      //mapear y enviar custom fields al job 8
      // const requestsCustomFields = await this.customFieldsMapperService.mappedCustomFields(
      //   enCard,
      //   createdCustomFields,
      // );
      //       mapCFToCreate.
      //     }
      //   }
      //   );

      //mapear y enviar custom fields al job 8
      const requestsCustomFields =""
        // await this.customFieldsMapperService.mappedCustomFields(
          // enCard,
          // fetchedCustomFields,
        // );
      for (const customField of requestsCustomFields) {
        try {
          // this.jumpsellerGatewayQueue.add(
          //   'add-custom-field',
          //   {
          //     requestType: RequestTypeEnum.CUSTOM_FIELDS,
          //     body: customField,
          //     productId: productId,
          //   },
          //   {
          //     priority: 3,
          //   },
          // );
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
