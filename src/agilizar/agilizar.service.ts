import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { InjectModel } from '@nestjs/mongoose';
import { Agilizar, AgilizarDocument } from './entities/agilizar.entity';
import { Model } from 'mongoose';
import { OrderResponse } from '../order/interface/order-response.interface';
import { ISellResponse } from './interface/sell-response.interface';
import { ConfigService } from '@nestjs/config';
import {Cron, CronExpression} from "@nestjs/schedule";

@Injectable()
export class AgilizarService {
  private readonly logger = new Logger(AgilizarService.name);
  private client_id: string;
  private secret_key: string;

  constructor(
    @InjectModel(Agilizar.name) private readonly model: Model<AgilizarDocument>,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.client_id = this.configService.get('CLIENT_ID_FULLERTON');
    this.secret_key = this.configService.get('SECRET_KEY_FULLERTON');
  }

  private getDefaultDates(
    from?: string,
    to?: string,
  ): { from: string; to: string } {
    const date = new Date();
    const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    return { from: from || formattedDate, to: to || formattedDate };
  }

  async generateToken(): Promise<string> {
    const { data } = await firstValueFrom(
      this.http
        .post<{
          GenerarTokenResult: string;
        }>(
          'GenerarToken',
          {},
          {
            headers: { client_id: this.client_id, secret_key: this.secret_key },
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

  @Cron(CronExpression.EVERY_6_HOURS)
  async updateToken(): Promise<void> {
    await this.model.deleteMany({});
    await this.generateToken();
  }
  async getToken(): Promise<string> {
    const token = await this.model.findOne({});
    return token ? token.token : this.generateToken();
  }

  async getVentas(from?: string, to?: string): Promise<ISellResponse> {
    const dates = this.getDefaultDates(from, to);
    const token = await this.getToken();
    const { data } = await firstValueFrom(
      this.http
        .get<ISellResponse>(`get_reporteVentas/${dates.from}/${dates.to}`, {
          headers: { token },
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

  async getCompras(from?: string, to?: string): Promise<OrderResponse> {
    const dates = this.getDefaultDates(from, to);
    const token = await this.getToken();
    const { data } = await firstValueFrom(
      this.http
        .get<OrderResponse>(`get_reporteCompras/${dates.from}/${dates.to}`, {
          headers: { token },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.message);
            throw new ServiceUnavailableException(
              `Error al obtener las compras, ${error.message}`,
            );
          }),
        ),
    );
    return data;
  }
}
