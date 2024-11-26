import { Injectable } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { UserRole } from './users/enums/user-role.enum';

@Injectable()
export class AppService {
  constructor(
    private readonly user: UsersService,
    private readonly auth: AuthService,
  ) {}

  async seed() {
    await this.user.deleteMany();
    const password = await this.auth.hashPassword('12345678');
    const user = {
      name: 'Sistemas',
      email: 'sistemas@fixlabs.cl',
      password,
      rol: UserRole.Admin,
    };
    await this.user.create(user);
    return 'Seed Data';
  }
}
