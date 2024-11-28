import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Sale, SaleDocument } from './entities/sale.entity';
import { AgilizarService } from '../agilizar/agilizar.service';
import { Model } from 'mongoose';
import { formatDate } from '../common/formatDate';
import { GetReporteVentasResult } from '../agilizar/interface/SellResponse.interface';
import { ClientsService } from '../clients/clients.service';
import { ClientInterface } from '../clients/interface/client.interface';
import { ProductsService } from '../products/products.service';
import { ProductInterface } from '../products/interface/product.interface';
import axios from 'axios';
@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name)
    private readonly model: Model<SaleDocument>,
    private readonly agilizar: AgilizarService,
    private readonly client: ClientsService,
    private readonly product: ProductsService,
  ) {}
  async checkNewSales() {
    const { get_reporteVentasResult: data } = await this.agilizar.getVentas(
      '2024-09-01',
      '2024-11-10',
    );
    for (const sale of data) {
      const saleExists = await this.model.exists({ OBJECT_ID: sale.OBJECT_ID });
      if (!saleExists) await this.model.create(sale);
    }
    return {
      message: 'Sales checked',
    };
  }
  //TODO: Validar si cambio el Modelo
  async findAll() {
    const sales = await this.model.find().exec();
    return sales.map((sale) => ({
      uuid: sale._id,
      order_id: sale.OBJECT_ID,
      client_name: sale?.Cliente?.[0]?.nombre ?? null,
      sucursal_name: sale?.Sucursal?.[0]?.nombre ?? null,
      user_name: sale?.Usuario?.[0]?.nombre ?? null,
      sale_status: sale?.VentaEstado?.[0]?.nombre ?? null,
      status: sale.esta_activo ? 'Activo' : 'Inactivo',
      delivery_date: sale.fecha_entrega,
      checkin_date: sale.fecha_ingreso,
      iva: sale.iva,
      neto: sale.neto,
      nr_document: sale.numero_documento,
      status_payment: sale.pagado ? 'Pagado' : 'Pendiente',
      total: sale.total,
    }));
  }
  async findOne(id: string) {
    const sale = await this.model.findById(id).exec();
    if (!sale) throw new NotFoundException('Sale not found');
    return sale;
  }
  async findOneByOrderId(id: number): Promise<Sale | null> {
    const sale = await this.model.findOne({ OBJECT_ID: id }).exec();
    if (!sale) return null;
    return sale;
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
  private async distributeSales(sale: GetReporteVentasResult) {
    const saleExists = await this.findOneByOrderId(sale.OBJECT_ID);
    if (saleExists) return;
    const client = await this.client.findClientByUuid(sale.cliente_id);
    if (!client && sale.Cliente && sale.Cliente.length > 0) {
      const clientData = sale.Cliente[0];
      const newClient: ClientInterface = {
        checkInDate: clientData.fecha_ingreso,
        clientType: clientData.tipo_cliente_id,
        contact: clientData.contacto,
        email: clientData.email,
        giro: clientData.giro_id,
        houseNumber: clientData.fono_casa,
        lastname: clientData.apellido,
        name: clientData.nombre,
        obs: clientData.observaciones,
        phoneNumber: clientData.fono_celular,
        rut: clientData.rut,
        status: clientData.esta_activo,
        uuid: clientData.cliente_id,
        web: clientData.direccion_web,
      };
      await this.client.createClient(newClient);
    }
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
    await this.model.create(sale);
  }
  async generateSale(id: number) {
    const sale = await this.findOneByOrderId(id);
    if (!sale) throw new NotFoundException('Sale not found');
    const businessCenter = 'FULVENVEN000000';
    const details = sale.DetalleVenta.map((product) => {
      return {
        type: 'A',
        isExempt: false,
        code: product.Producto[0].sku,
        count: product.cantidad,
        productName: product.Producto[0].nombre,
        productNameBarCode: product.Producto[0].codigo_barra,
        price: `${product.precio_unitario}`,
        discount: {
          type: 0,
          value: '-0',
        },
        unit: 'UN',
        analysis: {
          accountNumber: '3110101001',
          businessCenter: businessCenter,
          classifier01: '',
          classifier02: '',
        },
        useBatch: false,
        batchInfo: [],
      };
    });
    const body = {
      documentType: 'BOLETAELECRS',
      firstFolio: 0,
      lastFolio: 0,
      externalDocumentID: `${sale.numero_documento}`,
      emissionDate: {
        day: 26,
        month: 11,
        year: 2024,
      },
      firstFeePaid: {
        day: 26,
        month: 11,
        year: 2024,
      },
      clientFile: `${sale.Cliente[0].cliente_id}`,
      contactIndex: 'DIRECCION GENERICA',
      paymentCondition: 'CONTADO',
      sellerFileId: 'VENDEDOR',
      clientAnalysis: {
        accountNumber: '3110101001',
        businessCenter: 'FULVEN000000000',
        classifier01: '',
        classifier02: '',
      },
      billingCoin: 'PESO',
      billingRate: 1,
      shopId: 'Local',
      priceList: '1',
      giro: `${sale.Cliente?.[0]?.GirosComerciales?.[0]?.nombre ?? 'GIRO GENERICO'}`,
      district: 'Generico',
      city: 'Generico',
      contact: -1,
      attachedDocuments: [],
      storage: {
        code: 'BODEGACENTRAL',
        motive: 'Venta de productos',
        storageAnalysis: {
          accountNumber: '',
          businessCenter: businessCenter,
          classifier01: 'classifier01',
          classifier02: 'classifier02',
        },
      },
      details: details,
      saleTaxes: [
        {
          code: 'IVA',
          value: 19,
          taxeAnalysis: {
            accountNumber: '2120301001',
            businessCenter: businessCenter,
            classifier01: '',
            classifier02: '',
          },
        },
      ],
      ventaRecDesGlobal: [],
      gloss: '',
      customFields: [],
      isTransferDocument: false,
    };
    const token =
      '';
    const headers = {
      Authorization: `Bearer ${token}`,
    };
    try {
      const response = await axios.post(
        'https://replapi.defontana.com/api/Sale/SaveSale',
        body,
        { headers },
      );
      return {
        response: response.data,
        body,
      };
    } catch (error) {
      throw new BadRequestException('Error registering sale');
    }
  }
}
