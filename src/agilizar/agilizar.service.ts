import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SellResponse } from './interface/SellResponse.interface';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class AgilizarService {
  private readonly logger = new Logger(AgilizarService.name);
  constructor(private readonly http: HttpService) {}

  private getDefaultDates(
    from?: string,
    to?: string,
  ): { from: string; to: string; } {
    if (!to || !from) {
      const date = new Date();
      const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      return { to: formattedDate, from: formattedDate };
    }
    return { to, from };
  }

  async getVentas(from?: string, to?: string): Promise<SellResponse> {
    const dates = this.getDefaultDates(from, to);
    const { data } = await firstValueFrom(
      this.http
        .get<SellResponse>(`get_reporteVentas/${dates.from}/${dates.to}`)
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.message);
            throw error;
          }),
        ),
    );
    return data;
  }

  async getCompras(to?: string, from?: string): Promise<SellResponse> {
    const dates = this.getDefaultDates(to, from);
    const { data } = await firstValueFrom(
      this.http
        .get<SellResponse>(`get_reporteCompras/${dates.from}/${dates.to}`)
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.message);
            throw error;
          }),
        ),
    );
    return data;
  }
}
