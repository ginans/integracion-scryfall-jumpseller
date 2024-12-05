import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User, UserDocument } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(userDto: CreateUserDto): Promise<User> {
    const user = new this.userModel(userDto);
    return user.save();
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findById(id: string): Promise<User | null> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid ID format');
    }
    const user = await this.userModel
      .findById(new Types.ObjectId(id))
      .select('-password')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(
    id: string,
    userDto: Partial<UpdateUserDto>,
  ): Promise<User | null> {
    return this.userModel
      .findByIdAndUpdate(new Types.ObjectId(id), userDto, { new: true })
      .select('-password')
      .exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async updateStatus(id: string): Promise<User | null> {
    const user: UserDocument = await this.userModel
      .findById(new Types.ObjectId(id))
      .select('-password')
      .exec();
    if (!user) return null;
    user.status = !user.status;
    return user.save();
  }

  async updatePass(id: string, password: string): Promise<User | null> {
    const user = await this.userModel.findById(new Types.ObjectId(id)).exec();
    if (!user) return null;
    user.password = password;
    return user.save();
  }

  async deleteMany(): Promise<void> {
    await this.userModel.deleteMany().exec();
  }

  async deleteById(id: string): Promise<User> {
    return this.userModel.findByIdAndDelete(new Types.ObjectId(id)).exec();
  }

  async updateLogin(id: string): Promise<User | null> {
    try {
      const user = await this.userModel.findById(new Types.ObjectId(id)).exec();
      if (!user) return null;
      user.lastLogin = new Date();
      return user.save();
    } catch {
      return null;
    }
  }
}
