import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Defontana } from './entities/defontana.entity';
import { Model } from 'mongoose';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { AuthResponse } from './interfaces/AuthResponse.interface';

@Injectable()
export class DefontanaService {
  private readonly logger = new Logger(DefontanaService.name);
  constructor(
    @InjectModel(Defontana.name) private readonly model: Model<Defontana>,
    private readonly http: HttpService,
  ) {}
  private async generateToken(): Promise<string> {
    const params = {
      client: '20240826224114600001',
      company: '20240826224114600001',
      user: 'APPTOMATOR',
      password: 'FULLERTON',
    };
    const { data } = await firstValueFrom(
      this.http
        .get<AuthResponse>('auth', {
          params,
        })
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
    await this.model.create({ token: data.access_token });
    return data.access_token;
  }
  private async getToken(): Promise<string> {
    const token = await this.model.findOne();
    return token ? token.token : this.generateToken();
  }
  async postSale(body) {
    const token = await this.getToken();
    const { data } = await firstValueFrom(
      this.http
        .post<{
          documentType: null;
          firstFolio: number;
          lastFolio: number;
          ted: null;
          success: boolean;
          message: string;
          exceptionMessage: null;
        }>(`sale/savesale`, body, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.message);
            throw new ServiceUnavailableException(
              `Error al generar Venta, ${error.message}`,
            );
          }),
        ),
    );
    return data;
  }
  async createClient(body): Promise<void> {
    const token = await this.getToken();
    const { data } = await firstValueFrom(
      this.http
        .post<{ success: boolean; message: string }>(`sale/saveclient`, body, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(error.message);
            throw new ServiceUnavailableException(
              `Error al generar Venta, ${error.message}`,
            );
          }),
        ),
    );
    if (
      !data.success &&
      data.message !== `El cliente con codigo ${body.fileid} ya existe`
    )
      throw new BadRequestException(data.message);
  }
}
