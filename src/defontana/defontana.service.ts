import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { DefontanaToken, DefontanaTokenDocument } from './entities/defontana.entity';
import { Model } from 'mongoose';
import { AuthResponse } from './interfaces/auth-response.interface';
import {OrderRequestInterface, PurchaseInterface, SaleRequestInterface} from './interfaces/defontana-request.interface';
import {
  BaseDefontanaResponse,
  DefontanaResponse,
  PurchaseOrderResponse,
} from './interfaces/defontana-response.interface';
import { IProvider } from '../order/interface/provider.interface';
import { IPurchaseOrderRequest } from '../order/interface/purchase-order-request.interface';
import { LoggerService } from '../common/logger/logger.service';
import { DefontanaCredential, DefontanaCredentialDocument } from './entities/defontana.credential.entity';
import { CredentialsDto } from './dto/credentials.dto';
import { ClientInterface } from '../clients/interface/client.interface';
import { DefontanaEndpointsEnum } from './interfaces/defontana-endpoints.enum';

@Injectable()
export class DefontanaService {

  constructor(
    @InjectModel(DefontanaToken.name) private readonly authTokenModel: Model<DefontanaTokenDocument>,
    @InjectModel(DefontanaCredential.name) private readonly credentialModel: Model<DefontanaCredentialDocument>,
    private readonly loggerService: LoggerService,
  ) {}

  async getCredential() {
    return this.credentialModel.findOne();
  }

  async createCredential(credential: CredentialsDto) {
    return this.credentialModel.create(credential);
  }

  private async getAuthToken(): Promise<string> {
    const token = await this.authTokenModel.findOne();
    return token ? `${token.token_type} ${token.access_token}` : this.generateToken();
  }

  async generateToken(): Promise<string> {
    const credential = await this.getCredential();
    const params = {
      client: credential.client,
      company: credential.company,
      user: credential.user,
      password: credential.password,
    };
    try {
      const url = `${credential.urlApi}${DefontanaEndpointsEnum.AUTH}`;
      const { data } = await axios.get<AuthResponse>(url, { params });
      const { access_token, token_type } = data;
      await this.authTokenModel.deleteMany({});
      await this.authTokenModel.create({ access_token, token_type });
      await this.credentialModel.findOneAndUpdate({ configIsValid: true });
      return `${token_type} ${access_token}`;
    } catch (error) {
      this.loggerService.error(error);
      throw new ServiceUnavailableException('Error al obtener token');
    }
  }

  async createProvider(provider: IProvider): Promise<void> {
    const token = await this.getAuthToken()
    const { urlApi } = await this.getCredential();
    const url = `${urlApi}${DefontanaEndpointsEnum.CREATE_PROVIDER}`;
    try {
      const { data } = await axios.post<BaseDefontanaResponse>(url, provider, {
        headers: { Authorization: token },
      });
      if (
        !data.success &&
        data.message !== `Proveedor ${provider.fileid} ya existe en el sistema`
      )
        this.loggerService.error(data.message);
    } catch (error) {
      console.error(error.response?.data);
      this.loggerService.error(error.response.data.exceptionMessage || error);
      throw new ServiceUnavailableException('Error al crear Proveedor');
    }
  }

  async createPurchaseOrder(purchaseOrder: IPurchaseOrderRequest): Promise<PurchaseOrderResponse> {
    const token = await this.getAuthToken();
    const { urlApi } = await this.getCredential();
    const url = `${urlApi}${DefontanaEndpointsEnum.CREATE_PURCHASE_ORDER}`;
    try {
      const { data } = await axios.post<PurchaseOrderResponse>(url, purchaseOrder, {
        headers: { Authorization: token },
      });
      if (
        !data.success &&
        data.message !==
        `Proveedor ${purchaseOrder.comment} ya existe en el sistema`
      )
        this.loggerService.error(data.message);
      return data
    } catch (error) {
      console.error(error.response?.data);
      this.loggerService.error(error);
      throw new ServiceUnavailableException('Error al crear Orden de Compra');
    }
  }

  async createPurchase(purchase: PurchaseInterface): Promise<number> {
    const token = await this.getAuthToken();
    const { urlApi } = await this.getCredential();
    const url = `${urlApi}${DefontanaEndpointsEnum.CREATE_PURCHASE}`;
    try {
      const { data } = await axios.post<DefontanaResponse>(url, purchase, {
        headers: { Authorization: token },
      });
      return data.folio;
    }
    catch (error) {
      this.loggerService.error(error);
      throw new ServiceUnavailableException('Error al crear Compra');
    }
  }

  async createClient(client: ClientInterface): Promise<void> {
    const token = await this.getAuthToken()
    const { urlApi } = await this.getCredential();
    const url = `${urlApi}${DefontanaEndpointsEnum.CREATE_CLIENT}`;
    try {
      const { data } = await axios.post<BaseDefontanaResponse>(url, client, {
        headers: { Authorization: token },
      });
      if (
        !data.success &&
        data.message !== `El cliente con codigo ${client.fileid} ya existe`
      )
        this.loggerService.error(data.message);
    } catch (error) {
      this.loggerService.error(error);
      throw new ServiceUnavailableException('Error al crear Cliente');
    }
  }

  async createOrder(order: OrderRequestInterface): Promise<DefontanaResponse> {
    const token = await this.getAuthToken()
    const { urlApi } = await this.getCredential();
    const url = `${urlApi}${DefontanaEndpointsEnum.CREATE_ORDER}`;
    try {
      const { data } = await axios.post<DefontanaResponse>(url, order, {
        headers: { Authorization: token },
      });
      if (!data.success) this.loggerService.error(data.message);
      return data;
    } catch (error) {
      this.loggerService.error(error);
      throw new ServiceUnavailableException('Error al crear Orden');
    }
  }

  async createSale(sale: SaleRequestInterface): Promise<DefontanaResponse> {
    const token = await this.getAuthToken();
    const { urlApi } = await this.getCredential();
    const url = `${urlApi}${DefontanaEndpointsEnum.CREATE_SALE}`;
    const { data } = await axios.post<DefontanaResponse>(url, sale, {
      headers: { Authorization: token },
    });
    return data;
  }
  // Paso 4: Obtener PDF TODO: Revisar
  async getPdf(folio: number) {
    const token = await this.getAuthToken();
    const { urlApi } = await this.getCredential();
    const url = `${urlApi}${DefontanaEndpointsEnum.GET_PDF}${folio}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: token },
      responseType: 'arraybuffer',
    });
    return data;
  }
  async getPdfStandardBase64(folio: number) {
    const token = await this.getAuthToken();
    const { urlApi } = await this.getCredential();
    const url = `${urlApi}${DefontanaEndpointsEnum.GET_PDF}${folio}`;
    const { data } = await axios.get(url, {
      headers: { Authorization: token },
      responseType: 'arraybuffer',
    });
    return data;
  }
}
