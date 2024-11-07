import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserInterface } from './interface/user.interface';

@Injectable()
export class UsersService {
  private logger = new Logger('UsersService');
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}
  async registerDB(user: UserInterface) {
    const Document: object = user;
    const newDocument = new this.userModel(Document);
    await newDocument.save();
    newDocument.password = null;
    return newDocument;
  }
  async findAll() {
    return await this.userModel.find().exec();
  }
  async findByEmail(email: string): Promise<UserInterface> {
    return this.userModel.findOne({ email });
  }
  async findOne(id: string): Promise<UserInterface> {
    const user = (await this.userModel.findById(id)) as UserInterface;
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }
  async updateStatus(id: string) {
    const user = await this.userModel.findById(id);
    user.status = !user.status;
    await user.save();
    return {
      message: 'Usuario actualizado correctamente',
    };
  }
  async updatePass(id: string, password: string) {
    const user = await this.userModel.findById(id);
    user.password = password;
    await user.save();
  }
  async updateInfo(id, user) {
    await this.userModel.findByIdAndUpdate(id, user);
  }
  async deleteMany() {
    await this.userModel.deleteMany({});
  }

  async updateLogin(id: string) {
    const user = await this.userModel.findById(id);
    user.lastLogin = new Date();
    await user.save();
  }
}
