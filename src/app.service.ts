import { Injectable } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { UserRole } from './users/enums/user-role.enum';
import { SalesService } from './sales/sales.service';

@Injectable()
export class AppService {
  constructor(
    private readonly user: UsersService,
    private readonly auth: AuthService,
    private readonly salesService: SalesService,
  ) {}

  async seed() {
    await this.user.deleteMany();
    const password = await this.auth.hashPassword('12345678');
    const user = {
      name: 'Sistemas',
      email: 'sistemas@fixlabs.cl',
      password,
      role: UserRole.Admin,
    };
    await this.user.create(user);
    return 'Seed Data';
  }

  async genericResponse() {
    return {
      ok: '1',
      folio: 10000021,
      pdf: 'https://fullerton.sfo3.digitaloceanspaces.com/simulador_carlos/archivo_pdf_simulador_prueba.pdf',
    };
  }

  async generateSale(body: any) {
    return await this.salesService.createSale(body);
  }

  async genericResponse3() {
    return {
      ok: '1',
      folio: 10000031,
      pdf: 'https://fullerton.sfo3.digitaloceanspaces.com/simulador_carlos/archivo_pdf_simulador_prueba.pdf',
    };
  }

  async genericResponse4() {
    return {
      ok: true,
      folio: 10000054,
      pdf: 'https://fullerton.sfo3.digitaloceanspaces.com/simulador_carlos/archivo_pdf_simulador_prueba.pdf',
    };
  }
}
