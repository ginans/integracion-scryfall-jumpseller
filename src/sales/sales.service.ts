import { BadRequestException, Injectable, Logger, NotAcceptableException } from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Sale, SaleDocument} from './entities/sale.entity';
import {Model} from 'mongoose';
import {ClientsService} from '../clients/clients.service';
import {ClientInterface} from '../clients/interface/client.interface';
import {DefontanaService} from '../defontana/defontana.service';
import {SaleState} from './interfaces/sale-state.interface';
import {IDetalle, IReceptor, TicketDto} from './dto/ticket.dto';
import {PaginationQueryDto} from '../common/dto/pagination-query.dto';
import {ProductDto} from './dto/product.dto';
import {formatRut} from "../common/formatRut";
import {FilesService} from "../files/files.service";
import {EnvConfiguration} from "../config/app.config";

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);
  private readonly businessCenter = 'FULVENVEN000000';
  private readonly accountNumber = '3110101001';
  constructor(
    @InjectModel(Sale.name)
    private readonly model: Model<SaleDocument>,
    private readonly defontana: DefontanaService,
    private readonly client: ClientsService,
    private readonly files: FilesService,
  ) {}
  async findAllSales(query: PaginationQueryDto) {
    const data = await this.model.find().exec();
    return {
      items: data,
      meta: {
        totalItems: data.length,
        itemsPerPage: 5,
        totalPages: data.length / 5,
        currentPage: 1,
        hasNextPage: true,
        hasPreviousPage: false,
      },
    };
  }
  /**
   * Crear una venta en DeFontana
   * Pasos:
   *   1. Validar que la venta no haya sido procesada con algún identificador único
   *   2. Validar que cliente exista en la BD de clientes
   *   3. Si no existe, crearlo
   *   4. Generar un Pedido en DeFontana
   *   5. Rescatar NR de pedido de DeFontana
   *   6. Generar una orden de venta en DeFontana
   *   7. Rescatar folio de orden de venta y pdf
   *   8. Retornar la URL del PDF y el folio
 */
  async createSale(data: TicketDto) {
    const sale = await this.findOneByOrderId(data.condicionpago.IdVenta);
    if (sale && sale.state !== SaleState.FALLIDO) {
      this.logger.error('Venta ya procesada');
      return {
        ok: '0',
        folio: null,
        pdf: null,
        error: 'Venta ya procesada',
      };
    }
    try {
      const rut = formatRut(data.Encabezado.Receptor.RUTRecep ?? '11111111-1');
      let client = await this.client.findClientByRut(rut);
      const clientObject: IReceptor = {...data.Encabezado.Receptor, RUTRecep: rut};
      if (!client && rut) await this.createClient(clientObject);
      client = client ?? (await this.client.findClientByRut('11.111.111-1'));
      console.log(data.condicionpago.IdVenta);
      await this.model.create({
        document_type: data.Encabezado.IdDoc.TipoDTE,
        emisor_rut: data.Encabezado.Emisor.RUTEmisor,
        client_rut: client.legalCode,
        client_rznSoc: client.name,
        client_giro: client.giro,
        client_direction: client.address,
        client_comune: client.district,
        client_city: client.city,
        total: data.Encabezado.Totales.MntTotal,
        iva: data.Encabezado.Totales.IVA,
        details: data.Detalles,
        payment_method: data.condicionpago.CondicionPago,
        seller: data.condicionpago.Vendedor,
        order_id: data.condicionpago.IdVenta,
        state: SaleState.PROCESANDO,
        defontana_id: null,
        error: null,
      });
      //Crear Venta en DeFontana
      const saleBody = this.createSaleBody(
        data.Detalles,
        data.condicionpago.IdVenta,
        client,
      );
      const defontanaResponse = await this.defontana.createSale(saleBody);
      if (!defontanaResponse.success) {
        const { message, exceptionMessage } = defontanaResponse;
        const errorMessage = `${message} - ${exceptionMessage}`;
        //Actualizar estado de la venta y guardar error
        await this.model.findOneAndUpdate(
          { order_id: data.condicionpago.IdVenta },
          {
            state: SaleState.FALLIDO,
            error: errorMessage,
          },
        );
        return { ok: '0', folio: null, pdf: null, error: errorMessage, };
      }
      //Asignar folio de venta a la venta y cambiar estado
      await this.model.findOneAndUpdate(
        { order_id: data.condicionpago.IdVenta },
        {
          state: SaleState.CREADO,
          defontana_id: defontanaResponse.firstFolio,
        },
      );
      const pdf = await this.defontana.getPdf8Cm(defontanaResponse.firstFolio);
      const pdfUrl = await this.files.savePdfFromBase64(pdf);
      await this.model.findOneAndUpdate(
        { order_id: data.condicionpago.IdVenta },
        {
          url_pdf: `${EnvConfiguration().url_app}${pdfUrl}`,
        },
      );
      return {
        ok: '1',
        folio: defontanaResponse.firstFolio,
        pdf: `${EnvConfiguration().url_app}${pdfUrl}`,
      };
    } catch (error) {
      this.logger.error(error.message);
      await this.model.findOneAndUpdate({ order_id: data.condicionpago.IdVenta }, { state: SaleState.FALLIDO, error: error.message });
      const response = {
        ok: '0',
        folio: null,
        pdf: null,
        error: error.message,
      };
      throw new NotAcceptableException(response);
    }
  }
  async findOne(id: number): Promise<Sale | null> {
    const sale = await this.model.findOne({ order_id: id }).exec();
    if (!sale) throw new BadRequestException('Venta no encontrada');
    return sale;
  }
  async findOneByOrderId(id: number): Promise<Sale | null> {
    return this.model.findOne({ order_id: id }).exec();
  }
  private async updateSaleState(id: number, state: SaleState) {
    await this.model.updateOne({ order_id: id }, { $set: { state } });
  }
  private async createClient(client: IReceptor) {
    const newClient: ClientInterface = {
      legalCode: client.RUTRecep,
      fileid: client.RUTRecep,
      name: client.RznSocRecep,
      address: client.DirRecep,
      district: client.CmnaRecep,
      email: '',
      business: '',
      rubroId: '',
      giro: client.GiroRecep,
      city: client.CiudadRecep,
    };
    await this.defontana.createClient(newClient);
    await this.client.createClient(newClient);
  }
  private createSaleBody(
    details: IDetalle[],
    IdVenta: number,
    client: ClientInterface,
  ) {
    const detailsFormat: ProductDto[] = details.map((detail) => ({
      type: 'A',
      isExempt: false,
      code: detail.SKU,
      count: detail.QtyItem,
      productName: detail.NmbItem,
      productNameBarCode: detail.barCode,
      price: detail.PrcItem,
      discount: { type: 0, value: -0 },
      especificTax: {
        value: 0,
      },
      unit: 'UN',
      comment: '',
      analysis: {
        accountNumber: this.accountNumber,
        businessCenter: this.businessCenter,
        classifier01: '',
        classifier02: '',
      },
      useBatch: false,
      batchInfo: [],
    }));
    const today = new Date();
    const date = {
      day: today.getDate(),
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    };
    return {
      documentType: 'BOLETAELECRS',
      firstFolio: 0,
      lastFolio: 0,
      externalDocumentID: `${IdVenta}`,
      emissionDate: date,
      firstFeePaid: date,
      clientFile: `${client.fileid}`,
      contactIndex: client.address,
      rutMandante: '',
      paymentCondition: 'CONTADO',
      sellerFileId: 'VENDEDOR',
      clientAnalysis: {
        accountNumber: '1110401001',
        businessCenter: this.businessCenter,
        classifier01: '',
        classifier02: '',
      },
      billingCoin: 'PESO',
      billingRate: 1,
      shopId: 'Local',
      priceList: '1',
      giro: `${client.giro}`,
      district: `${client.district}`,
      city: `${client.city}`,
      contact: -1,
      attachedDocuments: [],
      storage: {
        code: 'BODEGACENTRAL',
        motive: 'Venta de productos',
        storageAnalysis: {
          accountNumber: '',
          businessCenter: this.businessCenter,
          classifier01: 'classifier01',
          classifier02: 'classifier02',
        },
      },
      details: detailsFormat,
      saleTaxes: [
        {
          code: 'IVA',
          value: 19,
          taxeAnalysis: {
            accountNumber: '2120301001',
            businessCenter: this.businessCenter,
            classifier01: '',
            classifier02: '',
          },
        },
      ],
      ventaRecDesGlobal: [],
      gloss: '',
      customFields: [],
      isTransferDocument: true,
    };
  }
}
