// import { Injectable } from '@nestjs/common';
// import * as ExcelJS from 'exceljs';
//
// @Injectable()
// export class ExportService {
//   async exportToExcel<T>(
//     data: T[],
//     columns: { header: string; key: string }[],
//     filename: string,
//   ): Promise<Buffer> {
//     const workbook = new ExcelJS.Workbook();
//     const worksheet = workbook.addWorksheet('Data');
//     worksheet.columns = columns;
//     worksheet.addRows(data);
//     return await workbook.xlsx.writeBuffer();
//   }
// }
