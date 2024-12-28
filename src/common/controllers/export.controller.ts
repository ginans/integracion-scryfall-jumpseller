import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ExportService } from '../services/export.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Model } from 'mongoose';
import { Sale, SaleDocument } from '../../sales/entities/sale.entity';
import { InjectModel } from '@nestjs/mongoose';

@Controller('export')
@UseGuards(JwtAuthGuard)
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
  ) {}

  @Post('excel')
  async exportToExcel(
    @Body()
    body: {
      model: string;
      filters?: Record<string, any>;
      columns?: { header: string; key: string }[];
      filename?: string;
    },
    @Res() res: Response,
  ) {
    const {
      model,
      filters = {},
      columns,
      filename = `export-${Date.now()}.xlsx`,
    } = body;

    // Obtener el modelo dinámicamente (necesitarás implementar esto según tu estructura)
    const modelInstance = this.getModel(model);

    const buffer = await this.exportService.exportToExcel(
      modelInstance,
      filters,
      columns,
    );

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });

    return res.send(buffer);
  }

  private getModel(modelName: string): Model<any> {
    const models = {
      Sale: this.saleModel,
      // Agrega otros modelos aquí
    };

    const model = models[modelName];
    if (!model) {
      throw new Error(`Model ${modelName} not found`);
    }
    return model;
  }
}
