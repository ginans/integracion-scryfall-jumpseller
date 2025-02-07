import {Controller, Post, Body } from '@nestjs/common';
import {FilesService} from "./files.service";

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}
  @Post('upload')
  async uploadPdf(@Body() body: { base64Data: string }) {
    const url = await this.filesService.savePdfFromBase64(body.base64Data);
    return { url: url };
  }
}

