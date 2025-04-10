import { Controller, Get,Query, Param, Post, HttpCode, Body} from '@nestjs/common';
import { JumpsellerService } from './jumpseller.service';

@Controller('jumpseller')
export class JumpsellerController {
  constructor(private readonly jumpsellerService: JumpsellerService,
  ) {}
}