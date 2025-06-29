import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { CustomFieldsMapperService } from 'src/modules/magic/mappers/jumpseller.customfields.mapper.service';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/addAnExistingCustomFieldToAProductRequest.interface';
import { RequestTypeEnum } from '../enums/request-type.enum';
import { MapCFCollection } from 'src/modules/jumpseller/interfaces/map-CF-collection.interface';
import { createCustomFieldRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/createCustomfieldRequest.interface';
import { map } from 'rxjs';

@Processor('3.5-create-or-update-CF', { concurrency: 40 })
export class CreateCustomFieldsRequestProcessor extends WorkerHost {
  constructor(
    private readonly magicCardsService: MagicCardsService,
    private readonly customFieldsMapperService: CustomFieldsMapperService,
    @InjectQueue('8-jumpseller-gateway')
    private readonly jumpsellerGatewayQueue: Queue<
      {
        requestType: RequestTypeEnum;
        body: createCustomFieldRequest;
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
        isCardCreated: boolean;
      },
      number,
      string
    >,
  ) {
    try {
      const { enCard, isCardCreated } = job.data;

      if (!isCardCreated) {
        throw new Error(
          '❌ La carta no fue creada, no se pueden crear custom fields',
        );
      }

      // Obtener valores de custom fields de bd
      const getCFData = await this.magicCardsService.getAllCFValues();
      if (!getCFData) {
        throw new Error(
          '❌ No se encontraron custom fields en la base de datos',
        );
      }
      // Mapear valores y labels de custom fields
      const mappedCFLabelAndValues: MapCFCollection =
        await this.customFieldsMapperService.mappedCFLabelAndValues(getCFData);

      const mapCreateCustomFieldsRequest =
        await this.customFieldsMapperService.mapCreateCustomFieldsRequest([
          mappedCFLabelAndValues.artists,
          mappedCFLabelAndValues.borderColors,
          mappedCFLabelAndValues.colors,
          mappedCFLabelAndValues.cmcs,
          mappedCFLabelAndValues.gameChangers,
          mappedCFLabelAndValues.keywords,
          mappedCFLabelAndValues.legalities,
          mappedCFLabelAndValues.manaCosts,
          mappedCFLabelAndValues.powers,
          mappedCFLabelAndValues.rarities,
          mappedCFLabelAndValues.setNames,
          mappedCFLabelAndValues.setTypes,
          mappedCFLabelAndValues.subTypeLines,
          mappedCFLabelAndValues.toughness,
          mappedCFLabelAndValues.typeLines,
          mappedCFLabelAndValues.textless,
          mappedCFLabelAndValues.fullArt,
          mappedCFLabelAndValues.colorIdentities,
        ]);

      // Enviar custom fields de a uno al job 8
      for (const customField of mapCreateCustomFieldsRequest) {
        await this.jumpsellerGatewayQueue.add('create-custom-field', {
          requestType: RequestTypeEnum.CREATE_CUSTOM_FIELDS,
          body: customField,
        });
      }

      await job.updateProgress(100);
    } catch (error) {
      console.error(error);
      throw new Error(`Job failed at step: ${error.message}`);
    }
  }
}
