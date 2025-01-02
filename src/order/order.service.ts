import { Injectable } from '@nestjs/common';
import { Order, OrderDocument } from './entities/order.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AgilizarService } from '../agilizar/agilizar.service';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { DefontanaService } from '../defontana/defontana.service';
import { SaleState } from '../sales/interfaces/sale-state.interface';
import { ProvidersService } from '../providers/providers.service';
import { ProviderInterface } from '../providers/interface/provider.interface';
import { IPurchaseOrderRequest } from './interface/purchase-order-request.interface';

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
      '2024-09-01',
      '2024-11-10',
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
    const orders: OrderDocument[] = await this.model.find().exec();
    return orders.map((order) => {
      return {
        id: order._id,
        orderId: order.numero_documento,
        providerName: order.Proveedor?.[0]?.razon_social ?? 'N/A',
        providerRut: order.Proveedor?.[0]?.rut ?? 'N/A',
        isNational: order.isNational,
        documentType: order.TipoDocumento?.[0]?.nombre ?? 'N/A',
        total: 'Sin Calcular',
        defontanaId: order.defontanaNumber ?? 0,
        status: order.status,
      };
    });
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
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
      order.status = SaleState.FALLIDO;
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
