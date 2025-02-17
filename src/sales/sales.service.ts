import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
  ServiceUnavailableException
} from '@nestjs/common';
import {InjectModel} from '@nestjs/mongoose';
import {Sale, SaleDocument} from './entities/sale.entity';
import {Model, SortOrder } from 'mongoose';
import {ClientsService} from '../clients/clients.service';
import {ClientInterface} from '../clients/interface/client.interface';
import {DefontanaService} from '../defontana/defontana.service';
import {IDetails, SaleState} from './interfaces/sale-state.interface';
import {TicketDto} from './dto/ticket.dto';
import {PaginationQueryDto} from '../common/dto/pagination-query.dto';
import {ProductDto} from './dto/product.dto';
import {formatRut} from "../common/formatRut";
import {FilesService} from "../files/files.service";
import {PaginatedResponse} from "../common/interfaces/paginated-response.interface";
import {CreateBillDto} from "./dto/bill.dto";
import {SaleRequestInterface} from "../defontana/interfaces/defontana-request.interface";
import {EnvConfiguration} from "../config/app.config";

interface SortOptions {
  [key: string]: SortOrder;
}
interface MongoRegexMatch {
  $regexMatch: {
    input: { $toString: string };
    regex: string;
    options?: string;
  };
}

interface MongoExpr {
  $expr: MongoRegexMatch;
}
type MongoQuery = {
  $or?: (MongoExpr | { [key: string]: any })[];
} & Partial<Record<keyof Sale, any>>;
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
  async findAllSales(query: PaginationQueryDto): Promise<PaginatedResponse<Sale>> {
    const { limit = 10, page = 1, filters = {}, sortOrder, sortBy, search } = query;
    let filter: MongoQuery  = { ...filters }
    if (search !== undefined) {
      filter.$or = [{
        $expr: {
          $regexMatch: {
            input: { $toString: "$order_id" },
            regex: search.toString(),
            options: "i"
          }
        }
      }];
    }
    const sort: SortOptions  = {};
    if (sortOrder && sortBy) sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
    try {
      const [total, data] = await Promise.all([
        this.model.countDocuments(filter),
        this.model
          .find(filter)
          .sort(sort)
          .skip(Math.max(0, limit * (page - 1)))
          .limit(limit)
          .exec(),
      ]);
      const totalPages = Math.ceil(total / limit);
      return {
        items: data,
        meta: {
          totalItems: total,
          itemsPerPage: data.length,
          totalPages,
          currentPage: page,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      this.logger.error(error.message);
      throw new BadRequestException(error.message);
    }
  }
  private async checkOrderState(orderId: number) {
    const sale = await this.findOneByOrderId(orderId);
    if (sale && sale.state !== SaleState.FALLIDO) {
      this.logger.error('Venta ya procesada');
      throw new NotAcceptableException({
        ok: '0',
        folio: null,
        pdf: null,
        error: 'Venta ya procesada',
      });
    }
    //Borrar venta si esta fallida
    if (sale && sale.state === SaleState.FALLIDO)
      await this.model.findOneAndDelete({ order_id: orderId });
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
  async createTicket(data: TicketDto) {
    const DOC_TYPE = 39;
    await this.checkOrderState(data.condicionpago.IdVenta);
    const rut = formatRut(data.Encabezado.Receptor.RUTRecep ?? '11111111-1');
    let client = await this.client.findClientByRut(rut);
    const clientObject: ClientInterface = {
      legalCode: rut,
      fileid: rut,
      name: data.Encabezado.Receptor.RznSocRecep,
      giro: data.Encabezado.Receptor.GiroRecep,
      address: data.Encabezado.Receptor.DirRecep,
      business: data.Encabezado.Receptor.GiroRecep,
      city: data.Encabezado.Receptor.CiudadRecep,
      district: data.Encabezado.Receptor.CmnaRecep,
      email: '',
      rubroId: '',
    };
    try {
      if (!client && rut) await this.createClient(clientObject);
      client = client ?? (await this.client.findClientByRut('11.111.111-1'));
      await this.createSale({
        Detalles: data.Detalles.map((detail) => ({
          name: detail.NmbItem,
          discount: detail.DscItem,
          price: detail.PrcItem,
          quantity: detail.QtyItem,
          unit: detail.UnmdItem,
          sku: detail.SKU,
          barcode: detail.barCode,
        }) as IDetails),
        rut,
        document_type: data.Encabezado.IdDoc.TipoDTE,
        total: data.Encabezado.Totales.MntTotal,
        iva: data.Encabezado.Totales.IVA,
        payment_method: data.condicionpago.CondicionPago,
        seller: data.condicionpago.Vendedor,
        order_id: data.condicionpago.IdVenta,
      }, client);
      const saleBody = this.createSaleBody(
        data.Detalles.map(
          (detail) => ({
            name: detail.NmbItem,
            discount: detail.DscItem,
            price: detail.PrcItem,
            quantity: detail.QtyItem,
            unit: detail.UnmdItem,
            sku: detail.SKU,
            barcode: detail.barCode,
          }),
        ),
        data.condicionpago.IdVenta,
        data.condicionpago.CondicionPago,
        data.condicionpago.Vendedor,
        client,
        DOC_TYPE,
      );
      const response = await this.processSale(saleBody);
      if (response.ok === '0') return {
        ok: '0',
        folio: null,
        pdf: null,
        error: response.error,
      }
      const pdf = await this.defontana.getPdf8Cm(response.folio);
      const pdfUrl = await this.files.savePdfFromBase64(pdf);
      const url_pdf = `${EnvConfiguration().url_app}${pdfUrl}`;
      await this.model.findOneAndUpdate(
        { order_id: data.condicionpago.IdVenta },
        {
          url_pdf,
        },
      );
      return {
        ok: '1',
        folio: response.folio,
        pdf: url_pdf,
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
      throw new BadRequestException(response);
    }
  }
  async createBill(data: CreateBillDto){
    const DOC_TYPE = 33;
    await this.checkOrderState(data.Orden.IdVenta);
    const rut = formatRut('11111111-1');
    let client = await this.client.findClientByRut(rut);
    const clientObject: ClientInterface = {
      legalCode: rut,
      fileid: rut,
      name: data.Cliente.Nombre,
      giro: data.Cliente.Giro,
      address: data.Cliente.Direccion,
      business: data.Cliente.Giro,
      city: '',
      district: '',
      email: data.Cliente.Email,
      rubroId : '',
    };
    try {
      if (!client && rut) await this.createClient(clientObject);
      client = client ?? (await this.client.findClientByRut('11.111.111-1'));
      await this.createSale({
          Detalles: data.Productos.map(product => ({
            name: 'Sin información',
            discount: '',
            price: product.total / product.cantidad,
            quantity: product.cantidad,
            unit: 'UN',
            sku: product.SKU,
            barcode: product.BarCode
            })),
          rut,
          document_type: 39,
          total: data.Totales.MntTotal,
          iva: data.Totales.IVA,
          payment_method: data.Orden.CondicionPago,
          seller: data.Orden.Vendedor,
          order_id: data.Orden.IdVenta,
        }, client);
      const saleBody = this.createSaleBody(
        data.Productos.map(product => ({
          name: 'Sin información',
          discount: '',
          price: product.total / product.cantidad,
          quantity: product.cantidad,
          unit: 'UN',
          sku: product.SKU,
          barcode: product.BarCode
        })),
        data.Orden.IdVenta,
        data.Orden.CondicionPago,
        data.Orden.Vendedor,
        client,
        DOC_TYPE,
      );
      const response = await this.processSale(saleBody);
      if (response.ok === '0'){
        await this.saveFailedSale(data.Orden.IdVenta, response.error);
        return {
          ok: '0',
          folio: null,
          pdf: null,
          error: response.error,
        }
      }
      const pdf = await this.defontana.getPdfStandardBase64(response.folio);
      const pdfUrl = await this.files.savePdfFromBase64(pdf);
      const url_pdf = `${EnvConfiguration().url_app}${pdfUrl}`;
      await this.model.findOneAndUpdate(
        { order_id: data.Orden.IdVenta },
        {
          url_pdf,
        },
      );
      return {
        ok: '1',
        folio: response.folio,
        pdf: url_pdf,
      };
    } catch (error) {
      this.logger.error(error.message);
      await this.saveFailedSale(data.Orden.IdVenta, error.message);
      const response = {
        ok: '0',
        folio: null,
        pdf: null,
        error: error.message
      }
      throw new BadRequestException(response);
    }
  }

  private async saveFailedSale(order_id: number, error: string) {
    await this.model.findOneAndUpdate({ order_id }, { state: SaleState.FALLIDO, error });
  }
  async processSale(data: SaleRequestInterface): Promise<{
    ok: string;
    folio: number | null;
    pdf: null;
    error?: string | null
  }> {
    try {
      const { success, exceptionMessage, firstFolio, message } = await this.defontana.createSale(data);
      if (!success) {
        const errorMessage = `${message} - ${exceptionMessage}`;
        await this.saveFailedSale(+data.externalDocumentID.toString(), errorMessage);
        return { ok: '0', folio: null, pdf: null, error: errorMessage };
      }
      await this.model.findOneAndUpdate(
        { order_id: data.externalDocumentID },
        { state: SaleState.CREADO, defontana_id: firstFolio },
      );
      return { ok: '1', folio: firstFolio, pdf: null };
    } catch (error) {
      this.logger.error(error.message);
      await this.saveFailedSale(+data.externalDocumentID, error.message);
      throw new ServiceUnavailableException({
        ok: '0',
        folio: null,
        pdf: null,
        error: error.message,
      });
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

  private async createClient(client: ClientInterface) {
    await this.defontana.createClient(client);
    await this.client.createClient(client);
  }

  private async createSale(data: {
    Detalles: IDetails[];
    rut: string;
    document_type: number;
    total: number;
    iva: number;
    payment_method: string;
    seller: string;
    order_id: number;
  }, client: ClientInterface) {
    await this.model.create({
      document_type: data.document_type,
      emisor_rut: data.rut,
      client_rut: client.legalCode,
      client_rznSoc: client.name,
      client_giro: client.giro,
      client_direction: client.address,
      client_comune: client.district,
      client_city: client.city,
      total: data.total,
      iva: data.iva,
      details: data.Detalles,
      payment_method: data.payment_method,
      seller: data.seller,
      order_id: data.order_id
    });
  }

  private createSaleBody(
    details: IDetails[],
    IdVenta: number,
    CondicionPago: string,
    Vendedor: string,
    client: ClientInterface,
    documentType: number,
  ): SaleRequestInterface {
    const detailsFormat: ProductDto[] = details.map((detail) => ({
      type: 'A',
      isExempt: false,
      code: detail.sku,
      count: detail.quantity,
      productName: detail.name,
      productNameBarCode: detail.barcode,
      price: detail.price,
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
      documentType: this.getDocumentType(documentType),
      firstFolio: 0,
      lastFolio: 0,
      externalDocumentID: `${IdVenta}`,
      emissionDate: date,
      firstFeePaid: date,
      clientFile: `${client.fileid}`,
      contactIndex: client.address,
      rutMandante: '',
      paymentCondition: CondicionPago,
      sellerFileId: Vendedor,
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

  private getDocumentType(documentType: number) {
    switch (documentType) {
      case 33: return 'FVARSELECT';
      case 39: return 'BOLETAELECRS';
      case 61: return 'NCVRSELECT';
      default: return 'BOLETAELECRS';
    }
  }

  async getResumeToSales () {
    const [total, completed, pending, failed] = await Promise.all([
      this.model.countDocuments(),
      this.model.countDocuments({ state: SaleState.CREADO }),
      this.model.countDocuments({ state: SaleState.PROCESANDO }),
      this.model.countDocuments({ state: SaleState.FALLIDO }),
    ]);
    return { total, completed, pending, failed };
  }
}
