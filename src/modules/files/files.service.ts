import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private readonly uploadDir: string = 'uploads/pdfs';
  private readonly publicPath: string = 'pdfs';
  constructor() {
    if (!fs.existsSync(this.uploadDir)) fs.mkdirSync(this.uploadDir, { recursive: true });
  }
  async savePdfFromBase64(base64Data: string): Promise<string> {
    const base64Clean = base64Data.replace(/^data:application\/pdf;base64,/, '');
    const fileName = `${uuidv4()}.pdf`;
    const filePath = path.join(this.uploadDir, fileName);
    const buffer = Buffer.from(base64Clean, 'base64');
    await fs.promises.writeFile(filePath, buffer);
    return `/${this.publicPath}/${fileName}`;
  }
}