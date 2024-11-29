import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { SellResponse } from './interface/SellResponse.interface';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Agilizar } from './entities/agilizar.entity';
import { Model } from 'mongoose';
import { OrderResponse } from '../order/interface/order-response.interface';

@Injectable()
export class AgilizarService {
  private readonly logger = new Logger(AgilizarService.name);
  constructor(
    @InjectModel(Agilizar.name)
    private readonly model: Model<Agilizar>,
    private readonly http: HttpService,
  ) {}

  private getDefaultDates(
    from?: string,
    to?: string,
  ): { from: string; to: string } {
    if (!to || !from) {
      const date = new Date();
      const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      return { to: formattedDate, from: formattedDate };
    }
    return { to, from };
  }
  async generateToken(): Promise<string> {
    const { data } = await firstValueFrom(
      this.http
        .post<{ GenerarTokenResult: string }>(
          'GenerarToken',
          {},
          {
            headers: {
              client_id: process.env.CLIENT_ID_FULLERTON,
              secret_key: process.env.SECRET_KEY_FULLERTON,
            },
          },
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.message);
            throw new ServiceUnavailableException(
              `Error al obtener el token, ${error.message}`,
            );
          }),
        ),
    );
    await this.model.deleteMany({});
    await this.model.create({ token: data.GenerarTokenResult });
    return data.GenerarTokenResult;
  }
  async getToken(): Promise<string> {
    const token = await this.model.findOne({});
    if (!token) {
      return this.generateToken();
    }
    return token.token;
  }
  async getVentas(from?: string, to?: string): Promise<SellResponse> {
    const dates = this.getDefaultDates(from, to);
    const token: string = await this.getToken();
    const { data } = await firstValueFrom(
      this.http
        .get<SellResponse>(`get_reporteVentas/${dates.from}/${dates.to}`, {
          headers: {
            token,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.message);
            throw new ServiceUnavailableException(
              `Error al obtener las ventas, ${error.message}`,
            );
          }),
        ),
    );
    return data;
  }
  async getCompras(to?: string, from?: string): Promise<OrderResponse> {
    const dates = this.getDefaultDates(to, from);
    const { data } = await firstValueFrom(
      this.http
        .get<OrderResponse>(`get_reporteCompras/${dates.from}/${dates.to}`)
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
