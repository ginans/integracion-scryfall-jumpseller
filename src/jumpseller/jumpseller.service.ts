import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { JumpsellerProductRequest } from 'src/jumpseller/interfaces/jumpsellerProductRequest.interface';
import { JumpsellerProductResponse } from './interfaces/jumpsellerProductResponse.interface';

@Injectable()
export class JumpsellerService {  

  private readonly logger = new Logger(JumpsellerService.name);
   constructor(
    ) { }

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
}

