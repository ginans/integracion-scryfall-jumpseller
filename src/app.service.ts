import { Injectable } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';

@Injectable()
export class AppService {
  constructor(
    private readonly user: UsersService,
    private readonly auth: AuthService,
  ) {}
  getHello(): string {
    return 'Hello World!';
  }
  
  async seed() {
    await this.user.deleteMany();
    const password = await this.auth.hashPassword('12345678');
    const user = {
      name: 'Sistemas',
      email: 'sistemas@fixlabs.cl',
      password,
      rol: 'admin',
      lastLogin: new Date(),
      status: true,
    };
    await this.user.registerDB(user);
    return 'Seed Data';
  }
}
