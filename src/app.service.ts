import { Injectable } from '@nestjs/common';
import { SalesService } from './sales/sales.service';
import { TicketDto } from './sales/dto/ticket.dto';
import {CreateBillDto} from "./sales/dto/bill.dto";

@Injectable()
export class AppService {
  constructor(
    private readonly salesService: SalesService,
  ) {}
  async generateBill(body: CreateBillDto) {
    return await this.salesService.createBill(body);
    // return {
    //   ok: '1',
    //   folio: 10000021,
    //   pdf: 'https://fullerton.sfo3.digitaloceanspaces.com/simulador_carlos/archivo_pdf_simulador_prueba.pdf',
    // };
  }

  async generateTicket(body: TicketDto) {
    return await this.salesService.createTicket(body);
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
