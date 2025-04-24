import { Body, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { JumpsellerProductRequest } from 'src/jumpseller/interfaces/jumpsellerProducts/jumpsellerCreateProductRequest.interface';
import { JumpsellerProductResponse } from './interfaces/jumpsellerProducts/jumpsellerCreateProductResponse.interface';
import { JumpsellerCreateVariantRequest } from './interfaces/jumpsellerVariants/JumpsellerCreateVariantRequest.interface';
import { JumpsellerCreateVariantResponse } from './interfaces/jumpsellerVariants/jumpsellerCreateVariantResponse.interface';
import { JumpsellerCreateImageRequest } from './interfaces/jumpsellerImages/jumpsellerCreateImageRequest.interface';
import { JumpsellerCreateImageResponse } from './interfaces/jumpsellerImages/jumpsellerCreateImageResponse.interface';
import { JumpsellerUpdateProductRequest } from './interfaces/jumpsellerProducts/JumpsellerUpdateProductRequest.interface';
import { JumpsellerUpdateProductResponse } from './interfaces/jumpsellerProducts/jumpsellerUpdateProductResponse.interface';
import { CreateCustomFieldResponse } from './interfaces/jumpselllerCustomFields/createCustomFieldResponse.interface';
import { createCustomFieldRequest } from './interfaces/jumpselllerCustomFields/createCustomfieldRequest.interface';
import { AddAnExistingCustomFieldToAProductRequest } from './interfaces/jumpselllerCustomFields/addAnExistingCustomFieldToAProductRequest.interface';
import { AddAnExistingCustomFieldToAProductResponse } from './interfaces/jumpselllerCustomFields/addAnExistingCustomFieldToAProductResponse.interface';
import { JumpsellerGetAllProductResponse } from './interfaces/jumpsellerProducts/jumpsellerGetAllProduct.interface';
import { UpdateCustomFieldRequest } from './interfaces/jumpselllerCustomFields/updateCustomFieldRequest.interface';
import { UpdateCustomFieldResponse } from './interfaces/jumpselllerCustomFields/updateCustomFieldResponse.interface';
import { CustomFieldResponse, GetAllCustomFieldResponse } from './interfaces/jumpselllerCustomFields/getAllCustomFieldResponse.interface';
import { StockJumpsellerRequest } from './interfaces/stockToJumpseller/stockJumpsellerRequest.interface';
import { JumpsellerUpdateVariantRequest } from './interfaces/jumpsellerVariants/jumpsellerUpdateVariantRequest.interface';
import { JumpsellerUpdateVariantResponse } from './interfaces/jumpsellerVariants/jumpsellerUpdateVariantResponse.interface';

@Injectable()
export class JumpsellerService {  
  private readonly logger = new Logger(JumpsellerService.name);

    //crear producto en jumpseller
    async createJumpsellerProducts(product:JumpsellerProductRequest): Promise<JumpsellerProductResponse> { 
      const jumpsellerApiUrl = 'https://api.jumpseller.com/v1/products.json';
      const login = process.env.JUMPSELLER_LOGIN
      const authtoken = process.env.JUMPSELLER_AUTHTOKEN
      const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  
      try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
        this.logger.debug(`Cuerpo de la solicitud: ${JSON.stringify(product)}`);
        const {data}= await axios.post(
          jumpsellerApiUrl,
          { product }, 
          { 
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return data as JumpsellerProductResponse;
      } catch (error) {
        this.logger.error(`❌ Error al crear producto en Jumpseller: ${error.message}`);
        if (error.response) {
          this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
          this.logger.error(`Código de estado: ${error.response.status}`);
          this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
        }
      }
    }

    //obtener todos los productos de jumpseller
    async getAllJumpsellerProducts() : Promise<JumpsellerGetAllProductResponse> { 
      const jumpsellerApiUrl = `https://api.jumpseller.com/v1/products.json`;
      const login = process.env.JUMPSELLER_LOGIN
      const authtoken = process.env.JUMPSELLER_AUTHTOKEN
      const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  
      try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
        const {data}= await axios.get(
          jumpsellerApiUrl,
          { 
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return data as JumpsellerProductResponse;
      } catch (error) {
        this.logger.error(`❌ Error al traer todos los productos de Jumpseller: ${error.message}`);
        if (error.response) {
          this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
          this.logger.error(`Código de estado: ${error.response.status}`);
          this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
        }
      }
    }

    //obtener un producto por id de jumpseller
    async getJumpsellerProductById(productId: number): Promise<JumpsellerGetAllProductResponse> {
      const jumpsellerApiUrl = `https://api.jumpseller.com/v1/products/${productId}.json`;
      const login = process.env.JUMPSELLER_LOGIN
      const authtoken = process.env.JUMPSELLER_AUTHTOKEN
      const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  
      try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
        const {data}= await axios.get(
          jumpsellerApiUrl,
          { 
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return data as JumpsellerProductResponse;
      } catch (error) {
        this.logger.error(`❌ Error al traer el producto ${productId} de Jumpseller: ${error.message}`);
        if (error.response) {
          this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
          this.logger.error(`Código de estado: ${error.response.status}`);
          this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
        }
      }
    }

    //actualizar producto en jumpseller
    async updateJumpsellerProduct(productId: number, product:JumpsellerUpdateProductRequest): Promise<JumpsellerUpdateProductResponse> {
      const jumpsellerApiUrl = `https://api.jumpseller.com/v1/products/${productId}.json`;
      const login = process.env.JUMPSELLER_LOGIN
      const authtoken = process.env.JUMPSELLER_AUTHTOKEN
      const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  
      try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
        this.logger.debug(`Cuerpo de la solicitud: ${JSON.stringify(product)}`);
        const {data}= await axios.put<JumpsellerUpdateProductResponse>(
          jumpsellerApiUrl,
          { product }, 
          { 
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return data as JumpsellerUpdateProductResponse;
      } catch (error) {
        this.logger.error(`❌ Error al actualizar producto en Jumpseller: ${error.message}`);
        if (error.response) {
          this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
          this.logger.error(`Código de estado: ${error.response.status}`);
          this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
        }
      }
    }
    

    //crear imagenes de producto en jumpseller
    async insertJumpsellerImages(productId: number, images: JumpsellerCreateImageRequest): Promise<JumpsellerCreateImageResponse> {
      const jumpsellerApiUrl = `https://api.jumpseller.com/v1/products/${productId}/images.json`;
      const login = process.env.JUMPSELLER_LOGIN
      const authtoken = process.env.JUMPSELLER_AUTHTOKEN
      const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  
      try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
        this.logger.debug(`Cuerpo de la solicitud: ${JSON.stringify(images)}`);
        const {data}= await axios.post<JumpsellerCreateImageResponse>(
          jumpsellerApiUrl,
           images, 
          { 
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return data;
      } catch (error) {
        this.logger.error(`❌ Error al insertar imágenes en Jumpseller: ${error.message}`);
        if (error.response) {
          this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
          this.logger.error(`Código de estado: ${error.response.status}`);
          this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
        }
      }
    }

    //crear campos personalizados en jumpseller
    async createJumpsellerCustomFields(customFields: createCustomFieldRequest): Promise<CreateCustomFieldResponse> {
      const jumpsellerApiUrl = `https://api.jumpseller.com/v1/custom_fields.json`;
      const login = process.env.JUMPSELLER_LOGIN
      const authtoken = process.env.JUMPSELLER_AUTHTOKEN
      const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  
      try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
        this.logger.debug(`Cuerpo de la solicitud: ${JSON.stringify(customFields)}`);
        const {data}= await axios.post<CreateCustomFieldResponse>(
          jumpsellerApiUrl,
          { customFields }, 
          { 
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return data as CreateCustomFieldResponse;
      } catch (error) {
        this.logger.error(`❌ Error al crear campos personalizados en Jumpseller: ${error.message}`);
        if (error.response) {
          this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
          this.logger.error(`Código de estado: ${error.response.status}`);
          this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
        }
      }
    }

    //actualizar campo personalizado en jumpseller
    async updateJumpsellerCustomFields(customFieldId: number, customFields: UpdateCustomFieldRequest): Promise<UpdateCustomFieldResponse> {
      const jumpsellerApiUrl = `https://api.jumpseller.com/v1/custom_fields/${customFieldId}.json`;
      const login = process.env.JUMPSELLER_LOGIN
      const authtoken = process.env.JUMPSELLER_AUTHTOKEN
      const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  
      try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
        this.logger.debug(`Cuerpo de la solicitud: ${JSON.stringify(customFields)}`);
        const {data}= await axios.put<UpdateCustomFieldResponse>(
          jumpsellerApiUrl,
          { customFields }, 
          { 
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return data as UpdateCustomFieldResponse;
      } catch (error) {
        this.logger.error(`❌ Error al actualizar campos personalizados en Jumpseller: ${error.message}`);
        if (error.response) {
          this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
          this.logger.error(`Código de estado: ${error.response.status}`);
          this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
        }
      }
    }

    //obtener todos los custom fields de jumpseller
    async getAllJumpsellerCustomFields(): Promise<CustomFieldResponse[]> {
      const jumpsellerApiUrl = `https://api.jumpseller.com/v1/custom_fields.json`;
      const login = process.env.JUMPSELLER_LOGIN
      const authtoken = process.env.JUMPSELLER_AUTHTOKEN
      const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  
      try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
        const {data}= await axios.get<CustomFieldResponse[]>(
          jumpsellerApiUrl,
          { 
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return data as CustomFieldResponse[];
      } catch (error) {
        this.logger.error(`❌ Error al obtener campos personalizados en Jumpseller: ${error.message}`);
        if (error.response) {
          this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
          this.logger.error(`Código de estado: ${error.response.status}`);
          this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
        }
      }
    }

    //agregar un campo personalizado existente a un producto en jumpseller
    async addAnExistingCustomFieldToAProduct(productId: number, customFields: AddAnExistingCustomFieldToAProductRequest): Promise<AddAnExistingCustomFieldToAProductResponse> {
      const jumpsellerApiUrl = `https://api.jumpseller.com/v1/products/${productId}/fields.json`;
      const login = process.env.JUMPSELLER_LOGIN
      const authtoken = process.env.JUMPSELLER_AUTHTOKEN
      const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  
      try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
        this.logger.debug(`Cuerpo de la solicitud: ${JSON.stringify(customFields)}`);
        const {data}= await axios.post<AddAnExistingCustomFieldToAProductResponse>(
          jumpsellerApiUrl,
          { customFields }, 
          { 
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return data as AddAnExistingCustomFieldToAProductResponse;
      } catch (error) {
        this.logger.error(`❌ Error al crear campos personalizados en Jumpseller: ${error.message}`);
        if (error.response) {
          this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
          this.logger.error(`Código de estado: ${error.response.status}`);
          this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
        }
      }
    }

    async addStocktoJumpseller( product: StockJumpsellerRequest) {
      const jumpsellerApiUrl = `https://api.jumpseller.com/v1/products_locations`;
      const login = process.env.JUMPSELLER_LOGIN
      const authtoken = process.env.JUMPSELLER_AUTHTOKEN
      const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  
      try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
        this.logger.debug(`Cuerpo de la solicitud: ${JSON.stringify({ product })}`);
        const {data}= await axios.put(
          jumpsellerApiUrl,
          product, 
          { 
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return data 
      } catch (error) {
        this.logger.error(`❌ Error actualizar stock en Jumpseller: ${error.message}`);
        if (error.response) {
          this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
          this.logger.error(`Código de estado: ${error.response.status}`);
          this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
        }
      }

    }

    // Crear una variante de producto en Jumpseller
    async createJumpsellerVariant(
      productId: number,
      variantReq: JumpsellerCreateVariantRequest
    ): Promise<JumpsellerCreateVariantResponse> {
      const login = process.env.JUMPSELLER_LOGIN;
      const authtoken = process.env.JUMPSELLER_AUTHTOKEN;
      const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');
      const jumpsellerApiUrl = `https://api.jumpseller.com/v1/products/${productId}/variants.json`;
      this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
      this.logger.debug(`Cuerpo de la solicitud: ${JSON.stringify(variantReq)}`);
      const { data } = await axios.post<JumpsellerCreateVariantResponse>(
        jumpsellerApiUrl,
        variantReq,
        {
          headers: {
            Authorization: `Basic ${authToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return data;
    }

    async updateVariant(productId: number, variantId: number, variant: JumpsellerUpdateVariantRequest): Promise<JumpsellerUpdateVariantResponse> {
      const jumpsellerApiUrl = `https://api.jumpseller.com/v1/products/${productId}/variants/${variantId}.json`;
      const login = process.env.JUMPSELLER_LOGIN
      const authtoken = process.env.JUMPSELLER_AUTHTOKEN
      const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  
      try {
        this.logger.debug(`Enviando solicitud a Jumpseller: ${jumpsellerApiUrl}`);
        this.logger.debug(`Cuerpo de la solicitud: ${JSON.stringify(variant)}`);
        const {data}= await axios.put<JumpsellerUpdateVariantResponse>(
          jumpsellerApiUrl,
          variant, 
          { 
            headers: {
              Authorization: `Basic ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return data as JumpsellerUpdateVariantResponse;
      } catch (error) {
        this.logger.error(`❌ Error al actualizar variantes en Jumpseller: ${error.message}`);
        if (error.response) {
          this.logger.error(`Detalles del error: ${JSON.stringify(error.response.data)}`);
          this.logger.error(`Código de estado: ${error.response.status}`);
          this.logger.error(`Encabezados de respuesta: ${JSON.stringify(error.response.headers)}`);
        }
      }
    }


}

