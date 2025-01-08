import {
  BadRequestException,
  Injectable,
  Logger,
  NotAcceptableException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Sale, SaleDocument } from './entities/sale.entity';
import { AgilizarService } from '../agilizar/agilizar.service';
import { Model } from 'mongoose';
import { IReportSell } from '../agilizar/interface/sell-response.interface';
import { ClientsService } from '../clients/clients.service';
import { ClientInterface } from '../clients/interface/client.interface';
import { ProductsService } from '../products/products.service';
import { ProductInterface } from '../products/interface/product.interface';
import { formatDate } from '../common/formatDate';
import { DefontanaService } from '../defontana/defontana.service';
import { SaleState } from './interfaces/sale-state.interface';
import { JobsService } from 'src/jobs/jobs.service';
import { TicketDto } from './dto/ticket.dto';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { PaginationService } from '../common/services/pagination.service';
import { SortOrder } from '../common/dto/pagination-query.dto';
import {
  OrderDetailInterface,
  OrderRequestInterface,
} from '../defontana/interfaces/defontana-request.interface';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);
  private readonly businessCenter = 'FULVENVEN000000';
  private readonly accountNumber = '3110101001';
  constructor(
    @InjectModel(Sale.name)
    private readonly model: Model<SaleDocument>,
    private readonly jobs: JobsService,
    private readonly agilizar: AgilizarService,
    private readonly defontana: DefontanaService,
    private readonly client: ClientsService,
    private readonly product: ProductsService,
    private readonly paginationService: PaginationService,
  ) {}

  // async checkNewSales() {
  //   const { get_reporteVentasResult: data } = await this.agilizar.getVentas(
  //     '2024-09-01',
  //     '2024-11-10',
  //   );
  //   for (const sale of data) {
  //     const saleExists = await this.model.exists({ OBJECT_ID: sale.OBJECT_ID });
  //     if (!saleExists) await this.model.create(sale);
  //   }
  //   return {
  //     message: 'Sales checked',
  //   };
  // }
  async findAllSales(query: PaginationQueryDto) {
    const allowedSortFields = [
      'order_id',
      'client_rut',
      'seller',
      'defontana_id',
    ];
    if (query.sortBy && !allowedSortFields.includes(query.sortBy))
      throw new BadRequestException(
        `Campos de ordenamiento permitidos: ${allowedSortFields.join(', ')}`,
      );
    const sortOrder = query.sortOrder || SortOrder.ASC;
    return await this.paginationService.paginate<Sale>(
      this.model,
      { ...query, sortOrder },
      allowedSortFields,
    );
  }
  async createSale(data: TicketDto) {
    try {
      /*
        Pasos:
        1. Validar que la venta no haya sido procesada con algun identificador unico
        2. Validar que cliente exista en la BD de clientes
        3. Si no existe, crearlo
        4. Crear un Pedido en DeFontana
        5. Rescatar NR de pedido de DeFontana
        6. Generar una orden de venta en DeFontana
        7. Rescatar folio de orden de venta y pdf
        8. Retornar la URL del PDF y el folio
       */
      const sale = await this.findOneByOrderId(data.condicionpago.IdVenta);
      if (sale) throw new Error('Venta ya procesada');
      let client = await this.client.findClientByRut(
        data.Encabezado.Receptor.RUTRecep,
      );
      if (!client && data.Encabezado.Receptor.RUTRecep) {
        const clientData: ClientInterface = {
          legalCode: data.Encabezado.Receptor.RUTRecep,
          fileid: data.Encabezado.Receptor.RUTRecep,
          name: data.Encabezado.Receptor.RznSocRecep,
          address: data.Encabezado.Receptor.DirRecep,
          district: data.Encabezado.Receptor.CmnaRecep,
          email: '',
          business: '',
          rubroId: '',
          giro: data.Encabezado.Receptor.GiroRecep,
          city: data.Encabezado.Receptor.CiudadRecep,
        };
        await this.defontana.createClient(clientData);
        await this.client.createClient(clientData);
      }
      client = client ?? (await this.client.findClientByRut('11.111.111-1'));
      //Obtener dia, mes y año actual
      const today = new Date();
      const date = {
        day: today.getDate(),
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      };
      //Create orderBody for DeFontana
      const orderBody: OrderRequestInterface = {
        documentTypeId: 'BOLETAELECRS',
        //number: 0,
        pricingId: '0',
        clientFileId: client.fileid,
        sellerFileId: 'VENDEDOR',
        referenceNumber: '0',
        paymentConditionId: 'CONTADO',
        billingCoinId: 'PESO',
        billingRate: 1,
        shopId: 'Local',
        priceListId: '1',
        billingType: '1',
        giro: client.giro,
        district: client.district,
        orderDetails: [],
        taxes: [],
        creationDate: date,
        expirationDate: date,
        glossGeneral: '',
        glossDispatch: '',
        glossBill: '',
        glossPresentation: '',
        orderRecDesGlobal: [],
      };
      //create detail for orderBody
      for (const detail of data.Detalles) {
        const detailFormat: OrderDetailInterface = {
          type: 'A',
          isExempt: false,
          isService: false,
          code: detail.SKU,
          unit: 'UN',
          count: detail.QtyItem,
          price: detail.PrcItem,
          deliveryTime: {
            hour: 22,
            minute: 30,
          },
          discount: {
            value: 0,
            type: 0,
          },
          tax: {
            code: 'IVA',
            value: 19,
          },
          comment: '',
          productName: detail.NmbItem,
          deliveryDate: date,
        };
        orderBody.orderDetails.push(detailFormat);
      }
      const folio = await this.defontana.createOrder(orderBody);
      return {
        ok: '1',
        folio: folio ?? 10000001,
        pdf: 'https://fullerton.sfo3.digitaloceanspaces.com/simulador_carlos/archivo_pdf_simulador_prueba.pdf',
      };
    } catch (error) {
      this.logger.error(error.message);
      const response = {
        ok: '0',
        folio: null,
        pdf: null,
        error: error.message,
      };
      throw new NotAcceptableException(response);
    }
  }
  // private mapSale(sale: SaleDocument) {
  //   return {
  //     uuid: sale._id,
  //     order_id: sale.OBJECT_ID,
  //     client_name: sale?.Cliente?.[0]?.nombre ?? 'N/A',
  //     sucursal_name: sale?.Sucursal?.[0]?.nombre ?? 'N/A',
  //     user_name: sale?.Usuario?.[0]?.nombre ?? 'N/A',
  //     checkin_date: sale.fecha_ingreso,
  //     iva: sale.iva,
  //     neto: sale.neto,
  //     nr_document: sale.numero_documento,
  //     total: sale.total,
  //     state: sale.state,
  //     defontana_id: sale.defontana_id ?? 0,
  //     error: sale.error ?? '',
  //   };
  // }

  // async findOne(id: string) {
  //   const sale = await this.model.findById(id).exec();
  //   if (!sale) throw new NotFoundException('Sale not found');
  //   return sale;
  // }
  async findOneByOrderId(id: number): Promise<Sale | null> {
    return this.model.findOne({ OBJECT_ID: id }).exec();
  }
  async test(date: { to?: string; from?: string }) {
    const today: string = date.to ?? formatDate(new Date());
    const yesterday: Date = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formatYesterdayDay = date.from ?? formatDate(yesterday);
    const { get_reporteVentasResult: data } = await this.agilizar.getVentas(
      formatYesterdayDay,
      today,
    );
    if (data.length === 0) return 'No hay ventas';
    for (const sale of data) {
      const saleExists = await this.model.exists({ OBJECT_ID: sale.OBJECT_ID });
      if (saleExists) continue;
      await this.distributeSales(sale);
    }
    return 'Nuevas ordenes distribuidas';
  }
  private async updateSaleState(id: number, state: SaleState) {
    await this.model.updateOne({ OBJECT_ID: id }, { $set: { state } });
  }
  // private async validateData(id: number): Promise<Sale> {
  //   const sale: Sale = await this.findOneByOrderId(id);
  //   if (!sale) throw new NotFoundException('Sale not found');
  //   if (!sale.cliente_id) throw new BadRequestException('Cliente no asociado');
  //   if (!sale.DetalleVenta || sale.DetalleVenta.length === 0)
  //     throw new BadRequestException('No hay productos asociados a la venta');
  //   if (sale.defontana_id || sale.state !== SaleState.PENDIENTE)
  //     throw new BadRequestException('Venta ya procesada');
  //   return sale;
  // }

  // async generateSale(id: number) {
  //   const sale: Sale = await this.validateData(id);
  //   try {
  //     //await this.jobs.addJob(id);
  //     await this.updateSaleState(id, SaleState.PROCESANDO);
  //     await this.processData(sale);
  //     await this.updateSaleState(id, SaleState.CREADO);
  //     return {
  //       message: 'Venta generada',
  //     };
  //   } catch (error) {
  //     await this.model.updateOne(
  //       { OBJECT_ID: sale.OBJECT_ID },
  //       {
  //         $set: {
  //           error: error.message,
  //         },
  //       },
  //     );
  //     await this.updateSaleState(id, SaleState.FALLIDO);
  //     throw new BadRequestException('Error al procesar la venta');
  //   }
  // }

  async processSale(data: TicketDto) {
    try {
      //Pasos:
      //1. Validar que la venta no haya sido procesada con algun identificador unico
      const sale = await this.findOneByOrderId(data.Encabezado.IdDoc.TipoDTE);
      if (!sale) throw new BadRequestException('Venta ya procesada');
      //2. Validar que no exista un job en cola de esta venta
      //3. Crear un job en cola con el id de la venta
      //4. Evaluar si el cliente existe en la BD de clientes
      const client = await this.client.findClientByRut(
        data.Encabezado.Emisor.RUTEmisor,
      );
      //5. Si no existe, crearlo
      if (!client) {
        const clientData: ClientInterface = {
          legalCode: data.Encabezado.Emisor.RUTEmisor,
          fileid: '',
          name: '',
          address: '',
          district: '',
          email: '',
          business: '',
          rubroId: '',
          giro: '',
          city: '',
        };
        //TODO: Crear un cliente en DeFontana
        await this.defontana.createClient(clientData);
        //6. Si no puede crearse, retornar un error
        //TODO: Crear un registro en la BD de clientes
        await this.client.createClient(clientData);
      }
      //7. Crear un Pedido en DeFontana
      //8. Rescatar NR de pedido de DeFontana
      //9. Crear un documento PDF con la información de la venta y NR de pedido
      //10. Retornar la URL del PDF y el NR de pedido(Folio)
      //11. Crear un registro en la BD de la venta con el NR de pedido
      //12. Gestionar Métodos de Pago en DeFontana
      //13 Registro completo
      return {
        ok: '1',
        folio: 10000026,
        pdf: 'https://fullerton.sfo3.digitaloceanspaces.com/simulador_carlos/archivo_pdf_simulador_prueba.pdf',
      };
    } catch (error) {
      const response = {
        ok: '0',
        folio: null,
        pdf: null,
        error: error.message,
      };
      throw new NotAcceptableException(response);
    }
  }

  // async processSales() {
  //   const sales = await this.model
  //     .find({ state: { $nin: [SaleState.FALLIDO, SaleState.PAGADO] } })
  //     .exec();
  //   for (const sale of sales) {
  //     try {
  //       await this.updateSaleState(sale.OBJECT_ID, SaleState.PROCESANDO);
  //       await this.processData(sale);
  //       await this.updateSaleState(sale.OBJECT_ID, SaleState.CREADO);
  //       await new Promise((resolve) => setTimeout(resolve, 1000));
  //     } catch (error) {
  //       await this.model.updateOne(
  //         { OBJECT_ID: sale.OBJECT_ID },
  //         {
  //           $set: {
  //             error: error.message,
  //           },
  //         },
  //       );
  //       await this.updateSaleState(sale.OBJECT_ID, SaleState.FALLIDO);
  //     }
  //   }
  //   return {
  //     message: 'Ventas procesadas',
  //   };
  // }

  // private async processData(sale: Sale): Promise<void> {
  //   const client = sale.Cliente?.[0];
  // const clientDto: ClientDto = {
  //   legalCode: client.rut,
  //   fileid: `${client.cliente_id}`,
  //   name: `${client.nombre} ${client.apellido}`,
  //   address: client.direccion_web ?? '',
  //   district: '',
  //   email: client.email,
  //   business: '',
  //   rubroId: '',
  //   giro: `${client.GirosComerciales?.[0]?.nombre ?? 'GIRO GENERICO'}`,
  //   city: '',
  // };
  // await this.defontana.createClient(clientDto);
  //   const details: ProductDto[] = sale.DetalleVenta.map((product) => ({
  //     type: 'A',
  //     isExempt: false,
  //     code: product.Producto[0].sku,
  //     count: product.cantidad,
  //     productName: product.Producto[0].nombre,
  //     productNameBarCode: product.Producto[0].codigo_barra,
  //     price: `${product.precio_unitario}`,
  //     discount: { type: 0, value: '-0' },
  //     unit: 'UN',
  //     analysis: {
  //       accountNumber: this.accountNumber,
  //       businessCenter: this.businessCenter,
  //       classifier01: '',
  //       classifier02: '',
  //     },
  //     useBatch: false,
  //     batchInfo: [
  //       //{ amount: product.cantidad, batchNumber: `${product.Producto[0].sku}` },
  //     ],
  //   }));
  //   const body = {
  //     documentType: 'BOLETAELECRS',
  //     firstFolio: 0,
  //     lastFolio: 0,
  //     externalDocumentID: `${sale.numero_documento}`,
  //     emissionDate: { day: '04', month: '12', year: '2024' },
  //     firstFeePaid: { day: '04', month: '12', year: '2024' },
  //     clientFile: `${sale.Cliente?.[0]?.cliente_id}`,
  //     contactIndex: client.direccion_web
  //       ? client.direccion_web
  //       : sale.clienteDireccion?.[0]?.direccion
  //         ? sale.clienteDireccion?.[0]?.direccion
  //         : 'DIRECCION GENERICA',
  //     paymentCondition: 'CONTADO',
  //     sellerFileId: 'VENDEDOR',
  //     clientAnalysis: {
  //       accountNumber: '1110401001',
  //       businessCenter: this.businessCenter,
  //       classifier01: '',
  //       classifier02: '',
  //     },
  //     billingCoin: 'PESO',
  //     billingRate: 1,
  //     shopId: 'Local',
  //     priceList: '1',
  //     giro: `${sale.Cliente?.[0]?.GirosComerciales?.[0]?.nombre ?? 'GIRO GENERICO'}`,
  //     district: 'Generico',
  //     city: 'Generico',
  //     contact: -1,
  //     attachedDocuments: [],
  //     storage: {
  //       code: 'BODEGACENTRAL',
  //       motive: 'Venta de productos',
  //       storageAnalysis: {
  //         accountNumber: '',
  //         businessCenter: this.businessCenter,
  //         classifier01: 'classifier01',
  //         classifier02: 'classifier02',
  //       },
  //     },
  //     details: details,
  //     saleTaxes: [
  //       {
  //         code: 'IVA',
  //         value: 19,
  //         taxeAnalysis: {
  //           accountNumber: '2120301001',
  //           businessCenter: this.businessCenter,
  //           classifier01: '',
  //           classifier02: '',
  //         },
  //       },
  //     ],
  //     ventaRecDesGlobal: [],
  //     gloss: '',
  //     customFields: [],
  //     isTransferDocument: false,
  //   };
  //   const defontanaResponse = await this.defontana.postSale(body);
  //   if (!defontanaResponse.success)
  //     throw new BadRequestException(defontanaResponse.message);
  //   await this.model.updateOne(
  //     { OBJECT_ID: sale.OBJECT_ID },
  //     { $set: { defontana_id: defontanaResponse.firstFolio } },
  //   );
  // }

  private async distributeSales(sale: IReportSell) {
    const saleExists = await this.findOneByOrderId(sale.OBJECT_ID);
    if (saleExists) return;
    // const client = await this.client.findClientByUuid(sale.cliente_id);
    // if (!client && sale.Cliente && sale.Cliente.length > 0) {
    //   const clientData = sale.Cliente[0];
    //   const newClient: ClientInterface = {
    //     email: clientData.email,
    //     giro: `${clientData.giro_id}`,
    //     name: clientData.nombre,
    //     legalCode: clientData.rut,
    //     address: clientData.direccion_web,
    //     district: clientData.comuna_id,
    //     business: clientData.razon_social,
    //     rubroId: clientData.rubro_id,
    //     city: clientData.ciudad_id,
    //   };
    //   await this.client.createClient(newClient);
    // }
    if (sale.DetalleVenta.length === 0) return;
    for (const product of sale.DetalleVenta) {
      const productExists = await this.product.findProductByUuid(
        product.producto_id,
      );
      if (!productExists) {
        if (product.Producto.length === 0) return;
        const productData = product.Producto[0];
        const newProduct: ProductInterface = {
          barcode: productData.codigo_barra,
          brandId: productData.marca_id,
          catalog: productData.catalogo,
          ivaSpecific: productData.iva_especifico,
          ivaUnitary: productData.iva_unitario,
          name: productData.nombre,
          nameAttribute: productData.nombre_atributo,
          price: product.precio_unitario,
          productFamilyId: productData.producto_familia_id,
          productSubFamilyId: productData.producto_subfamilia_id,
          sku: productData.sku,
          skuOld: productData.sku_old,
          status: productData.esta_activo,
          type: productData.tipo,
          unity: productData.unidad_medida_id,
          uuid: productData.producto_id,
          visibility: productData.visible,
          wcProductId: productData.wc_producto_id,
          weight: productData.peso,
        };
        await this.product.createProduct(newProduct);
      }
    }
    await this.model.create({ ...sale, state: 'Registro' });
  }
}
