import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { MagicCardDocument } from '../../magic/entities/magic-card.entity';
import { MagicCardsService } from '../../magic/magic-cards.service';
import { CustomFieldsMapperService } from 'src/modules/magic/mappers/jumpseller.customfields.mapper.service';
import { AddAnExistingCustomFieldToAProductRequest } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/addAnExistingCustomFieldToAProductRequest.interface';
import { RequestTypeEnum } from '../enums/request-type.enum';
import { RateLimiterService } from 'src/common/services/rate-limiter.service';
import { JumpsellerCustomField } from 'src/modules/jumpseller/interfaces/custom-fields-jumpseller/getAllCustomFields.interface';

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

  // Cache estático para los custom fields y su timestamp
  private static customFieldsCache: JumpsellerCustomField[] | null = null;
  private static customFieldsCacheTimestamp: number = 0;
  private static readonly CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

  /**
   * Obtiene los custom fields desde cache si está vigente, o los refresca si expiró.
   * Esto evita hacer múltiples requests concurrentes a la base/API por cada job.
   * TTL (tiempo de vida del cache) definido por CACHE_TTL_MS.
   *
   * @returns {Promise<any[]>} Lista de custom fields actualizada o cacheada.
   */
  private async getCachedCustomFields() {
    const now = Date.now();
    // Si el cache está vacío o expiró, refrescarlo
    // if (
    //   !CreateCustomFieldsRequestProcessor.customFieldsCache ||
    //   now - CreateCustomFieldsRequestProcessor.customFieldsCacheTimestamp >
    //     CreateCustomFieldsRequestProcessor.CACHE_TTL_MS
    // ) {
    //   // Fetch real a la base/API
    //   const fetched = await this.magicCardsService.getAllCustomFields();
    //   // Guardar en cache y actualizar timestamp
    //   CreateCustomFieldsRequestProcessor.customFieldsCache = fetched;
    //   CreateCustomFieldsRequestProcessor.customFieldsCacheTimestamp = now;
    // }
    // Retornar el cache (vigente o recién actualizado)
    return CreateCustomFieldsRequestProcessor.customFieldsCache;
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
      // Usar cache de custom fields
      const fetchedCustomFields = await this.getCachedCustomFields();
      if (!fetchedCustomFields || fetchedCustomFields.length === 0) return;
      console.log(
        `🔧 Enviando CUSTOMFIELDS al MAPEO POZOLE ✨: ${JSON.stringify(fetchedCustomFields)}`,
      );
      const requestsCustomFields =
        await this.customFieldsMapperService.mappedCustomFields(
          enCard,
          fetchedCustomFields,
        );
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
