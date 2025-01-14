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

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly model: Model<OrderDocument>,
    private readonly agilizar: AgilizarService,
    private readonly defontana: DefontanaService,
    private readonly providers: ProvidersService,
  ) {}
  async checkNewOrders() {
    const { get_reporteComprasResult: data } = await this.agilizar.getCompras(
      '2024-01-01',
      '2025-01-10',
    );
    for (const order of data) {
      const orderExists = await this.model.exists({
        numero_documento: order.numero_documento,
      });
      if (!orderExists) await this.model.create(order);
    }
    return {
      message: 'Order checked',
    };
  }
  async findAllOrders(query: PaginationQueryDto) {
    const { limit = 10, page, filters, sortOrder, sortBy, search } = query;
    //Aplicar Filtros
    const filter = {};
    if (filters) {
      Object.keys(filters).forEach((key) => {
        filter[key] = filters[key];
      });
    }
    //Aplicar Busqueda
    if (search) {
      const searchString = search.toString();
      filter['$or'] = [
        {
          $expr: {
            $regexMatch: {
              input: { $toString: '$numero_documento' },
              regex: searchString,
              options: 'i',
            },
          },
        },
        // Add other numeric fields if necessary
      ];
    }
    // if (search) {
    //   filter['$or'] = [
    //     { numero_documento: { $regex: search, $options: 'number' } },
    //     // { 'Proveedor.rut': { $regex: `${search}`, $options: 'i' } },
    //     // { 'TipoDocumento.nombre': { $regex: `${search}`, $options: 'i' } },
    //     // { defontanaNumber: isNaN(Number(search)) ? null : Number(search) },
    //   ];
    // }
    //Aplicar Orden
    const sort = {};
    if (sortOrder && sortBy) {
      sort[sortBy] = sortOrder;
    }
    //Paginacion
    const total = await this.model.countDocuments(filter);
    const data: Order[] = await this.model
      .find(filter)
      .sort(sort)
      .skip(limit * (page - 1))
      .limit(limit)
      .exec();
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
    return {
      total: await this.model.countDocuments({ isNational: query.isNational }),
      completed: await this.model.countDocuments({
        status: OrderState.FACTURA_CREADA,
        isNational: query.isNational,
      }),
      pending: await this.model.countDocuments({
        status: OrderState.PENDIENTE,
        isNational: query.isNational,
      }),
    };
  }
  async getAttachmentToForm() {
    //Retornar listado de ordenes, solo el id, y el numero de documento
    const attachment = {
      orders: await this.model
        .find({ status: OrderState.PENDIENTE })
        .select('numero_documento')
        .exec(),
      providers: await this.providers.getProviderForAttachment(),
    };
    return attachment;
  }
  async findAllNationalOrders() {
    return await this.model.find({ isNational: true }).exec();
  }
  async findAllInternationalOrders() {
    return await this.model.find({ isNational: false }).exec();
  }
  async processNewOrder(data: any) {
    /*
      Pasos:
        1. Validar que la orden no exista
        2. Crear la orden
        3. Validar que el proveedor exista
        4. Crear el proveedor si no existe
        5. ingresar una orden de compra a defontana
        6. Actualizar el estado de la orden
        7. Obtener el pdf de la orden y almacenarlo
        Casos Internacionales:
        8. Ingresar Documento de compra a defontana asociado a la orden
     */
    const { numero_documento } = data;
    if (await this.model.exists({ numero_documento }))
      return { message: 'Order already exists' };
    const order = await this.createOrder(data);
    try {
      const provider = data.Proveedor[0];
      if (!(await this.providers.findProviderByRut(provider.rut))) {
        const newProvider: ProviderInterface = {
          legalCode: provider.rut,
          name: provider.razon_social,
          email: provider.email,
          address: provider.direccion,
          district: '',
          business: '',
          rubroId: '',
          giro: '',
          city: '',
          phone: provider.telefono,
          fileid: `${provider.proveedor_id}`,
        };
        await this.defontana.createProvider(newProvider);
        await this.providers.createProvider(newProvider);
      }
      const purchaseOrder: IPurchaseOrderRequest = {
        providerID: `${data.Proveedor[0].proveedor_id}`,
        providerData: {},
        serie: '',
        number: 0,
        businessCenter: 'FULADMADM000000',
        coinID: 'PESO',
        paymentCondition: 'CONTADO',
        documentTypeId: 'FCA',
        exchangeRate: 1,
        receiptDate: '2025-01-02',
        expirationDate: '2025-01-02',
        emissionDate: '2025-01-02',
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
        dispatchCountry: 'cl',
        dispatchPhone: '',
        comment: `Orden de compra ${data.numero_documento}`,
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
          comment: '',
          productData: {
            code: detail.Producto[0].sku,
            name: detail.Producto[0].nombre,
            unit: 'UN',
            price: detail.precio_compra,
            description: detail.Producto[0].nombre,
            isService: false,
          },
        });
      }
      purchaseOrder.amountBeforeTaxes = amountWithoutTax;
      purchaseOrder.amountTotal = amountWithoutTax + taxes;
      purchaseOrder.taxes = taxes;
      const purchaseOrderNumber =
        await this.defontana.createPurchaseOrder(purchaseOrder);
      return { message: 'Order created', purchaseOrderNumber };
    } catch (error) {
      order.status = OrderState.FALLIDO;
      order.error = error.message;
      await order.save();
      return { message: 'Error' };
    }
  }

  async createOrder(data: any) {
    const newOrder = {
      IngresoDetalle: data.IngresoDetalle,
      Proveedor: data.Proveedor,
      TipoDocumento: data.TipoDocumento,
      esta_activo: data.esta_activo ?? true,
      fecha_creacion: data.fecha_creacion,
      fecha_documento: data.fecha_documento,
      fecha_vencimiento: data.fecha_vencimiento,
      ingreso_bodega_cabecera_id: data.ingreso_bodega_cabecera_id,
      numero_documento: data.numero_documento,
      proveedor_id: data.proveedor_id,
      tipo_documento_id: data.tipo_documento_id,
      isNational: data.isNational ?? true,
      status: SaleState.PENDIENTE,
      defontanaNumber: data.defontanaNumber ?? null,
      import_costs: data.import_costs ?? [],
    };
    return await this.model.create(newOrder);
  }
}
