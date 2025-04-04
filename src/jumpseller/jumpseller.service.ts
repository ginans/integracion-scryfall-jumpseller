import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { JumpsellerProductRequest } from 'src/magic-cards/interfaces/jumpsellerProductRequest.interface';

@Injectable()
export class JumpsellerService {  
  async createJumpsellerProduct(product: JumpsellerProductRequest) {
    const jumpsellerApiUrl = 'https://api.jumpseller.com/v1/products.json';
    const login = process.env.JUMPSELLER_LOGIN
    const authtoken = process.env.JUMPSELLER_AUTHTOKEN
    const authToken = Buffer.from(`${login}:${authtoken}`).toString('base64');  

    const { data } = await axios.post(
            jumpsellerApiUrl,
            { product }, 
            { 
              headers: {
                Authorization: `Basic ${authToken}`,
                'Content-Type': 'application/json',
              },
            }
          );


    // Esperar 300 ms antes de la siguiente solicitud
    // await new Promise(resolve => setTimeout(resolve, 300));
  }
  createJumpsellerVariant() {
    return 'This action adds a new jumpseller';
  }
  createJumpsellerImage() {
    return 'This action adds a new jumpseller';
  }

  updateJumpsellerProduct() {
    return `This action returns all jumpseller`;
  }

}

