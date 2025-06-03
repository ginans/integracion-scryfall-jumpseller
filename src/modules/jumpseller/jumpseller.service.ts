import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import { JumpsellerProductRequest } from 'src/modules/jumpseller/interfaces/jumpsellerProducts/jumpsellerCreateProductRequest.interface';
import { JumpsellerProductResponse } from './interfaces/jumpsellerProducts/jumpsellerCreateProductResponse.interface';
import { JumpsellerCreateVariantRequest } from './interfaces/jumpsellerVariants/JumpsellerCreateVariantRequest.interface';
import { JumpsellerCreateVariantResponse } from './interfaces/jumpsellerVariants/jumpsellerCreateVariantResponse.interface';
import { ICreateImageResponse, ICreateImageRequest } from './interfaces/create-image.interface';
import { AddAnExistingCustomFieldToAProductRequest } from './interfaces/jumpselllerCustomFields/addAnExistingCustomFieldToAProductRequest.interface';
import { AddAnExistingCustomFieldToAProductResponse } from './interfaces/jumpselllerCustomFields/addAnExistingCustomFieldToAProductResponse.interface';
import { StockJumpsellerRequest } from './interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { JumpsellerUpdateVariantRequest } from './interfaces/jumpsellerVariants/jumpsellerUpdateVariantRequest.interface';
import { JumpsellerUpdateVariantResponse, JumpsellerUpdateVariantResponseError } from './interfaces/jumpsellerVariants/jumpsellerUpdateVariantResponse.interface';
import { GetAllCustomFieldResponse } from './interfaces/jumpselllerCustomFields/getAllCustomFields.interface';
import { JumpsellerEndpoints } from './endpoints.enum';
import { EnvConfiguration } from '../../config/app.config';

@Injectable()
export class JumpsellerService {
  private readonly logger = new Logger(JumpsellerService.name);
  private readonly apiUrl: string;
  private readonly login: string;
  private readonly authToken: string;
  private readonly client: AxiosInstance;
  constructor() {
    this.apiUrl = EnvConfiguration().jumpseller_url;
    this.login = EnvConfiguration().jumpseller_login;
    this.authToken = EnvConfiguration().jumpseller_authtoken;
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },params: {
        login: this.login,
        authtoken: this.authToken,
      },
    });
  }
  private registerError(error: any): void {
    if (error.response) {
      this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
      this.logger.error(`Código de estado: ${error.response.status}`);
      this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
    }
  }
    async createProduct(product:JumpsellerProductRequest): Promise<JumpsellerProductResponse> {
      try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${product.product.sku}`);
        const { data } = await this.client.post<JumpsellerProductResponse>(JumpsellerEndpoints.PRODUCTS, product)
        return data;
      } catch (error) {
        this.logger.error(`❌ Error al crear producto en Jumpseller: ${error.message}`);
        this.registerError(error);
      }
    }
    async getJumpsellerProductById(productId: number): Promise<JumpsellerProductResponse> {
      try {
        const { data } = await this.client.get<JumpsellerProductResponse>(`${JumpsellerEndpoints.PRODUCT}/${productId}.json`)
        return data;
      } catch (error) {
        this.logger.error(`❌ Error al traer el producto ${productId} de Jumpseller: ${error.message}`);
        this.registerError(error);
      }
    }
    async insertImages(productId: number, images: ICreateImageRequest): Promise<ICreateImageResponse> {
      try {
        const { data } = await this.client.post<ICreateImageResponse>(`${JumpsellerEndpoints.PRODUCT}/${productId}/${JumpsellerEndpoints.IMAGES}`, images)
        return data;
      } catch (error) {
        this.logger.error(`❌ Error al insertar imágenes en Jumpseller: ${error.message}`);
        this.registerError(error);
      }
    }
    async getAllCustomFields(): Promise<GetAllCustomFieldResponse> {
      try {
        const { data } = await this.client.get<GetAllCustomFieldResponse>(JumpsellerEndpoints.CUSTOM_FIELDS);
        return data;
      } catch (error) {
        this.logger.error(`❌ Error al obtener campos personalizados en Jumpseller: ${error.message}`);
        this.registerError(error);
      }
    }
    async addCustomFieldInProduct(productId: number, customFields: AddAnExistingCustomFieldToAProductRequest): Promise<AddAnExistingCustomFieldToAProductResponse> {
      try {
        const { data } = await axios.post<JumpsellerProductResponse>(`${JumpsellerEndpoints.PRODUCT}/${productId}/${JumpsellerEndpoints.FIELDS}`, customFields);
        return data;
      } catch (error) {
        this.logger.error(`❌ Error al crear campos personalizados en Jumpseller: ${error.message}`);
        this.registerError(error);
      }
    }

    async addStock(stock: StockJumpsellerRequest): Promise<StockJumpsellerResponse> {
      try {
        const { data } = await this.client.put<StockJumpsellerResponse>(JumpsellerEndpoints.STOCK, stock);
        return data;
      } catch (error) {
        this.logger.error(`❌ Error actualizar stock en Jumpseller: ${error.message}`);
        this.registerError(error);
        if (error.response) return { status: error.response.status, message: error.response.data.message || error.message };
        return { status: 500, message: error.message };
      }
    }
    async createJumpsellerVariant( productId: number, variantReq: JumpsellerCreateVariantRequest): Promise<JumpsellerCreateVariantResponse> {
      try {
        const { data } = await this.client.post<JumpsellerCreateVariantResponse>(
          `${JumpsellerEndpoints.PRODUCT}/${productId}/${JumpsellerEndpoints.VARIANTS}`, variantReq
        );
        return data;
      } catch (error) {
        this.logger.error(`❌ Error al crear variante en Jumpseller: ${error.message}`);
        this.registerError(error);
      }
    }

    async updateVariant(productId: number, variantId: number, variant: JumpsellerUpdateVariantRequest): Promise<JumpsellerUpdateVariantResponse | JumpsellerUpdateVariantResponseError> {
    try {
      const { data } = await this.client.put<JumpsellerUpdateVariantResponse>(`${JumpsellerEndpoints.PRODUCT}/${productId}/${JumpsellerEndpoints.VARIANT}/${variantId}`, variant);
      return data;
    } catch (error) {
      this.logger.error(`❌ Error al actualizar variante en Jumpseller: ${error.message}`);
      this.registerError(error);
      if (error.response) return { message: error.response.data.message || error.message };
      return { message: error.message };
    }
  }
}
