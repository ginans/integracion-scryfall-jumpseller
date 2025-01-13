import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Provider, ProviderDocument } from './entities/provider.entity';
import { ProviderInterface } from './interface/provider.interface';

@Injectable()
export class ProvidersService {
  constructor(
    @InjectModel(Provider.name) private readonly model: Model<ProviderDocument>,
  ) {}
  async findAll() {
    return await this.model.find().exec();
  }
  async getProviderForAttachment() {
  //Retorna listado de proveedores, solo el id y el nombre
    return await this.model.find().select('_id name').exec();
  }
  async findProviderByRut(legalCode: string): Promise<Provider | null> {
    const client = await this.model.findOne({ legalCode }).exec();
    if (!client) return null;
    return client;
  }
  // async findProviderByUuid(uuid: number): Promise<Provider | null> {
  //   const client = await this.model.findOne({ uuid }).exec();
  //   if (!client) return null;
  //   return client;
  // }
  async createProvider(client: ProviderInterface) {
    return await this.model.create(client);
  }
}
