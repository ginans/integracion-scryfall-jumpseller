import { Injectable } from '@nestjs/common';
import { CreateRegisterDto } from './dto/create-register.dto';
//import { UpdateRegisterDto } from './dto/update-register.dto';

@Injectable()
export class RegistersService {
  create(createRegisterDto: CreateRegisterDto) {
    return 'This action adds a new register';
  }

  async findAll(query: string) {
    try {
      const search = query;
      const filter = search.length
        ? {
            $or: [
              { name: { $regex: search, $options: 'i' } },
              { rut: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } },
              { direccion: { $regex: search, $options: 'i' } },
              { city: { $regex: search, $options: 'i' } },
              { state: { $regex: search, $options: 'i' } },
              { marketplace: { $regex: search, $options: 'i' } },
            ],
          }
        : {};

      const clients = await getPaginatedItems('client', pagination, filter);
      return res.status(200).json(clients);
    } catch (err) {
      console.error('Error en getClients:', err.message);
      return res.status(500).json({ message: 'Error en el servidor', err });
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} register`;
  }

  // update(id: number, updateRegisterDto: UpdateRegisterDto) {
  //   return `This action updates a #${id} register`;
  // }
  //
  // remove(id: number) {
  //   return `This action removes a #${id} register`;
  // }
}
