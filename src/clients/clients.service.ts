import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Client } from './entities/client.entity';
import { Model } from 'mongoose';
import { ClientInterface } from './interface/client.interface';
import axios from 'axios';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private readonly model: Model<Client>,
  ) {}
  async findAll() {
    return await this.model.find().exec();
  }
  async findClientByUuid(uuid: number): Promise<Client | null> {
    const client = await this.model.findOne({ uuid }).exec();
    if (!client) return null;
    return client;
  }
  async createClient(client: ClientInterface) {
    return await this.model.create(client);
  }
  async registerClient(id: number) {
    const client = await this.findClientByUuid(id);
    if (!client) throw new NotFoundException('Client not found');
    const body = {
      legalCode: client.rut,
      fileid: `${client.uuid}`,
      name: client.name,
      address: '',
      district: '',
      email: client.email,
      business: 'string',
      rubroId: 'string',
      giro: `client.giro`,
      city: 'string',
    };
    const headers = {
      Authorization:
        'Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1laWQiOiJBRDEyM0ZULUhHREY1Ni1LSTIzS0wtS0pUUDk4NzYtSEdUMTIiLCJ1bmlxdWVfbmFtZSI6ImNsaWVudC5sZWdhY3lAZGVmb250YW5hLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vYWNjZXNzY29udHJvbHNlcnZpY2UvMjAxMC8wNy9jbGFpbXMvaWRlbnRpdHlwcm92aWRlciI6IkFTUC5ORVQgSWRlbnRpdHkiLCJBc3BOZXQuSWRlbnRpdHkuU2VjdXJpdHlTdGFtcCI6IkdIVEQyMzQtS0xISjc4NjgtRkc0OTIzLUhKRzA4RlQ1NiIsImNvbXBhbnkiOiIyMDI0MDgyNjIyNDExNDYwMDAwMSIsImNsaWVudCI6IjIwMjQwODI2MjI0MTE0NjAwMDAxIiwib2xkc2VydmljZSI6InZpc2lvbmFyeTIiLCJ1c2VyIjoiQVBQVE9NQVRPUiIsInNlc3Npb24iOiIxNzMyMTA3NTEzIiwic2VydmljZSI6InZpc2lvbmFyeTIiLCJjb3VudHJ5IjoiQ0wiLCJjb21wYW55X25hbWUiOiJGdWxsZXJ0b24iLCJjb21wYW55X2NvdW50cnkiOiJDTCIsInVzZXJfbmFtZSI6ImFwcHRvbWF0b3IiLCJleHBpcmF0aW9uX2RhdGUiOjE3NjQ1NDcyMDAsImNsaWVudF9jb25kaXRpb24iOiJTIiwicm9sZXNQb3MiOiJbXCJ1c3VhcmlvXCIsXCJ1c3VhcmlvZXJwXCJdIiwicnV0X3VzdWFyaW8iOiJBZG1pbmlzdHJhZG9yIiwiaXNzIjoiaHR0cHM6Ly8qLmRlZm9udGFuYS5jb20iLCJhdWQiOiIwOTkxNTNjMjYyNTE0OWJjOGVjYjNlODVlMDNmMDAyMiIsImV4cCI6MTc2MzY0MzUxMywibmJmIjoxNzMyMTA3NTEzfQ.HZSmeMSTuyi46xFU12Aa7978QYxwrx5JbUnkfj-p0WU',
    };
    try {
      const response = await axios.post(
        'https://replapi.defontana.com/api/Sale/SaveClient',
        body,
        { headers },
      );
      return response.data;
    } catch (error) {
      console.error('Error registering client', error.response.data);
      throw new BadRequestException('Error registering client');
    }
  }
}
