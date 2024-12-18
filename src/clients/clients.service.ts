import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Client, ClientDocument } from './entities/client.entity';
import { Model } from 'mongoose';
import { ClientInterface } from './interface/client.interface';

@Injectable()
export class ClientsService {
  constructor(
    @InjectModel(Client.name) private readonly model: Model<ClientDocument>,
  ) {}
  async findAll() {
    return await this.model.find().exec();
  }

  async findClientByRut(rut: string): Promise<Client | null> {
    const client = await this.model.findOne({ rut }).exec();
    if (!client) return null;
    return client;
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
