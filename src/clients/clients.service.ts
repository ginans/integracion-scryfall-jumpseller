import { Injectable } from '@nestjs/common';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Client } from './entities/client.entity';
import { Model } from 'mongoose';
import { ClientInterface } from './interface/client.interface';

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
}
