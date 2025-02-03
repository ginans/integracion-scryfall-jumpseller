import { Injectable } from '@nestjs/common';
import { Order, OrderDocument, OrderState } from './entities/order.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgilizarService } from '../agilizar/agilizar.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { DefontanaService } from '../defontana/defontana.service';
import { SaleState } from '../sales/interfaces/sale-state.interface';
import { ProvidersService } from '../providers/providers.service';
import { ProviderInterface } from '../providers/interface/provider.interface';
import { IPurchaseOrderRequest } from './interface/purchase-order-request.interface';
import { QueryResumeDto } from './dto/query-resume.dto';
import { GetReporteComprasResult } from './interface/order-response.interface';
import { formatRut } from "../common/formatRut";

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private readonly model: Model<OrderDocument>,
    private readonly agilizar: AgilizarService,
    private readonly defontana: DefontanaService,
    private readonly providers: ProvidersService,
  ) {}

  async checkNewOrders() {
    const { get_reporteComprasResult: data } = await this.agilizar.getCompras('2024-01-01', '2024-01-31');
    for (const order of data) {
      await this.processNewOrder(order);
    }
    return { message: 'Order checked' };
  }

  async findAllOrdersImports(query: PaginationQueryDto) {
    return this.findAllOrders(query, true);
  }

  async findAllOrdersNational(query: PaginationQueryDto) {
    return this.findAllOrders(query, false);
  }

  private async findAllOrders(query: PaginationQueryDto, isNational: boolean) {
    const { limit = 10, page, filters, sortOrder, sortBy, search } = query;
    const filter = { isNational, ...filters };
    if (search) {
      filter['$or'] = [{ $expr: { $regexMatch: { input: { $toString: '$numero_documento' }, regex: search.toString(), options: 'i' } } }];
    }
    const sort = sortOrder && sortBy ? { [sortBy]: sortOrder } : {};
    const total = await this.model.countDocuments(filter);
    const data = await this.model.find(filter).sort(sort).skip(limit * (page - 1)).limit(limit).exec();
    return {
      items: data,
      meta: {
        totalItems: total,
        itemsPerPage: limit,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        hasNextPage: total > limit * page,
        hasPreviousPage: page > 1,
      },
    };
  }

  async getResumeToDocuments(query: QueryResumeDto) {
    const { isNational } = query;
    return {
      total: await this.model.countDocuments({ isNational }),
      completed: await this.model.countDocuments({ status: { $in: [OrderState.ORDEN_CREADA, OrderState.FACTURA_CREADA] }, isNational }),
      pending: await this.model.countDocuments({ status: OrderState.PENDIENTE, isNational }),
    };
  }

  async getAttachmentToForm() {
    return {
      orders: await this.model.find({ status: OrderState.PENDIENTE }).select('numero_documento').exec(),
      providers: await this.providers.getProviderForAttachment(),
    };
  }

  async processNewOrder(data: GetReporteComprasResult) {
    const { numero_documento } = data;
    if (await this.model.exists({ numero_documento })) return { message: 'Order already exists' };
    const order = await this.createOrder(data);
    order.status = OrderState.PROCESANDO;
    await order.save();
    const provider = data.Proveedor[0];
    const rut = formatRut(provider.rut);
    if (!(await this.providers.findProviderByRut(rut))) {
      const newProvider: ProviderInterface = {
        legalCode: rut,
        name: provider.razon_social,
        email: provider.email,
        address: provider.direccion,
        phone: provider.telefono,
        fileid: rut,
        district: '',
        city: '',
        business: '',
        rubroId: '',
        giro: '',
      };
      await this.defontana.createProvider(newProvider);
      await this.providers.createProvider(newProvider);
      order.status = OrderState.PROVEEDOR_CREADO;
      await order.save();
    }
    try {
      const purchaseOrder: IPurchaseOrderRequest = {
        providerID: rut,
        providerData: {},
        serie: '',
        number: 0,
        businessCenter: 'FULADMADM000000',
        coinID: 'PESO',
        paymentCondition: 'CONTADO',
        documentTypeId: 'FCA',
        exchangeRate: 1,
        // Asi vienen en data, hay que cambiar el formato
        // "fecha_creacion": "02/09/2024 15:44:30",
        // "fecha_documento": "02/09/2024 0:00:00",
        // "fecha_vencimiento": "02/09/2024 0:00:00",
        receiptDate: '2025-01-28',
        expirationDate: '2025-01-28',
        emissionDate: '2025-01-28',
        // receiptDate: new Date(data.fecha_documento).toISOString(),
        // expirationDate: new Date(data.fecha_vencimiento).toISOString(),
        // emissionDate: new Date(data.fecha_creacion).toISOString(),
        amountBeforeTaxes: 0,
        modifiers: 0,
        amountExempt: 0,
        amountTotal: 0,
        taxes: 0,
        details: [],
        dispatchContact: '',
        dispatchAddress: '',
        dispatchDistrict: '',
        dispatchState: '',
        dispatchCity: '',
        dispatchCountry: '',
        dispatchPhone: '',
        comment: `Factura de compra ${data.numero_documento}`,
      };
      let taxes = 0;
      let amountWithoutTax = 0;
      for (const detail of data.IngresoDetalle) {
        const total = detail.precio_compra * detail.cantidad;
        amountWithoutTax += total;
        taxes += total * 0.19;
        purchaseOrder.details.push({
          isService: false,
          productID: detail.Producto[0].sku,
          quantity: detail.cantidad,
          total,
          discount: 0,
          discountType: 0,
          price: detail.precio_compra,
          productData: {
            code: detail.Producto[0].sku,
            name: detail.Producto[0].nombre,
            unit: 'UN',
            price: detail.precio_compra,
            description: detail.Producto[0].nombre,
            isService: false,
          },
          comment: '',
        });
      }
      purchaseOrder.amountBeforeTaxes = amountWithoutTax;
      purchaseOrder.amountTotal = amountWithoutTax + taxes;
      purchaseOrder.taxes = taxes;
      const { number, message, exceptionMessage, success } = await this.defontana.createPurchaseOrder(purchaseOrder);
      if (!success) {
        order.status = OrderState.FALLIDO;
        order.error = `${message} - ${exceptionMessage}`;
        throw new Error(`${message} - ${exceptionMessage}`);
      }
      order.defontanaNumber = +number;
      order.status = OrderState.ORDEN_CREADA;
      order.isNational = provider.internacional ?? true;
      await order.save();
      return { message: 'Order created', defontanaNumber: number };
    } catch (error) {
      order.status = OrderState.FALLIDO;
      order.error = error.message;
      await order.save();
      return { message: 'Error' };
    }
  }

  async createOrder(data: GetReporteComprasResult) {
    const newOrder = {
      ...data,
      isNational: data.Proveedor[0].internacional ?? true,
      status: SaleState.PENDIENTE,
      defontanaNumber: null,
      import_costs: [],
    };
    return this.model.create(newOrder);
  }
}