import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { Model } from 'mongoose';

const mockUser = {
  _id: '1',
  name: 'Test User',
  email: 'test@example.com',
  password: 'password',
  status: true,
  lastLogin: null,
  save: jest.fn().mockResolvedValue(this),
};

const mockUserModel = {
  new: jest.fn().mockResolvedValue(mockUser),
  constructor: jest.fn().mockResolvedValue(mockUser),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn().mockResolvedValue(mockUser),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
  deleteMany: jest.fn(),
  exec: jest.fn(),
  create: jest.fn().mockImplementation(() => ({
    ...mockUser,
    save: jest.fn().mockResolvedValue(mockUser),
  })),
};

describe('UsersService', () => {
  let service: UsersService;
  let model: Model<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<User>>(getModelToken(User.name));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a user', async () => {
    const user = await service.create(mockUser as any);
    expect(user).toEqual(mockUser);
  });

  it('should return all users', async () => {
    jest.spyOn(model, 'find').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce([mockUser]),
    } as any);
    const users = await service.findAll();
    expect(users).toEqual([mockUser]);
  });

  it('should find a user by id', async () => {
    jest.spyOn(model, 'findById').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUser),
    } as any);
    const user = await service.findById('1');
    expect(user).toEqual(mockUser);
  });

  it('should update a user', async () => {
    jest.spyOn(model, 'findByIdAndUpdate').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUser),
    } as any);
    const user = await service.update('1', { name: 'Updated User' });
    expect(user).toEqual(mockUser);
  });

  it('should delete a user by id', async () => {
    jest.spyOn(model, 'findByIdAndDelete').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUser),
    } as any);
    const user = await service.deleteById('1');
    expect(user).toEqual(mockUser);
  });

  it('should update user interfaces', async () => {
    jest.spyOn(model, 'findById').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUser),
    } as any);
    const user = await service.updateStatus('1');
    expect(user).toEqual(mockUser);
  });

  it('should update user password', async () => {
    jest.spyOn(model, 'findById').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUser),
    } as any);
    const user = await service.updatePass('1', 'newpassword');
    expect(user).toEqual(mockUser);
  });

  it('should update user last login', async () => {
    jest.spyOn(model, 'findById').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(mockUser),
    } as any);
    const user = await service.updateLogin('1');
    expect(user).toEqual(mockUser);
  });

  it('should delete many users', async () => {
    jest.spyOn(model, 'deleteMany').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(null),
    } as any);
    await service.deleteMany();
    expect(model.deleteMany).toHaveBeenCalled();
  });
});
