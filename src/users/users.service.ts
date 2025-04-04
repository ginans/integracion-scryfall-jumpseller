import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { User, UserDocument } from './entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { get, Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PaginatedResponse } from 'src/common/interfaces/paginated-response.interface';
import { SortOrder } from 'src/common/enums/query.enum';
import { Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(userDto: CreateUserDto): Promise<User> {
    const user = new this.userModel(userDto);
    return user.save();
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponse<User>> {
    const { limit, page, sortBy, sortOrder, to, from } = query;
   
    const sort: { [key: string]: 1 | -1 } = {
      [sortBy]: sortOrder === SortOrder.ASC ? 1 : -1,
    };

    const skip = (page - 1) * limit;
    const filters: { $or?: any[], $and?: any[] } = {};

    this.logger.log(`Fetching Users with query: ${JSON.stringify(query)}`);


      if (from && to) {
        filters.$and = [
          {
            lastLogin: {
              $gte: new Date(`${from}T00:00:00.000Z`),
              $lte: new Date(`${to}T23:59:59.999Z`)
            }
          },
        ];
      }

  
      try {
        const [users, total] = await Promise.all([
          this.userModel.find(filters).sort(sort).skip(skip).limit(limit).exec(),
          this.userModel.countDocuments(filters).exec()
        ]);
        return {
          items: users.map(user => user.toObject()),
          meta: {
            totalItems: total,
            itemsPerPage: users.length,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            hasNextPage: total > (page * limit),
            hasPreviousPage: page > 1,
          }
        }
      } catch (error) {
        throw new InternalServerErrorException(`Error fetching Transfers: ${error.message}`);
      }
    }

  

  async findById(id: string): Promise<User | null> {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException('Invalid ID format');
    const user = await this.userModel.findById(new Types.ObjectId(id)).exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createUser(userDto: CreateUserDto): Promise<UserDocument> {
    const userExist = await this.findByEmail(userDto.email);
    if (userExist) throw new BadRequestException('Usuario Ya Existe');
    userDto.password = await this.hashPassword(userDto.password);
    const user = await this.userModel.create(userDto);
    user.password = undefined;
    return user;
  }

  async update(
    id: string,
    userDto: Partial<UpdateUserDto>,
  ): Promise<User | null> {
    if (userDto.password)
      userDto.password = await this.hashPassword(userDto.password);
    return this.userModel
      .findByIdAndUpdate(new Types.ObjectId(id), userDto, { new: true })
      .exec();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async updateIsActive(id: string): Promise<User | null> {
    const user: UserDocument = await this.userModel
      .findById(new Types.ObjectId(id))
      .exec();
    if (!user) return null;
    user.isActive = !user.isActive;
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

  private async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }
}
