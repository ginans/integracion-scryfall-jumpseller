import { Injectable } from '@nestjs/common';
import { AuthService } from './auth/auth.service';
import { UsersService } from './users/users.service';
import { UserRole } from './users/enums/user-role.enum';
import { SalesService } from './sales/sales.service';
import { TicketDto } from './sales/dto/ticket.dto';
import { ClientsService } from './clients/clients.service';
import {DefontanaService} from "./defontana/defontana.service";

@Injectable()
export class AppService {
  constructor(
    private readonly user: UsersService,
    private readonly auth: AuthService,
    private readonly salesService: SalesService,
    private readonly clientService: ClientsService,
    private readonly defontanaService: DefontanaService,
  ) {}
  async genericResponse() {
    return {
      ok: '1',
      folio: 10000021,
      pdf: 'https://fullerton.sfo3.digitaloceanspaces.com/simulador_carlos/archivo_pdf_simulador_prueba.pdf',
    };
  }

  async generateSale(body: TicketDto) {
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
  async
  // async test() {
  //   const credential = {
  //     client: '20250107171152111005',
  //     company: '20250107171152111005',
  //     user: 'INTEGRACION',
  //     password: 'Fixlabs.2024!',
  //     urlApi: 'https://api.defontana.com/api/',
  //   }
  //   return this.defontanaService.generateToken();
  // }
}
