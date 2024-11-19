import { Controller } from '@nestjs/common';
import { DefontanaService } from './defontana.service';
@Controller('defontana')
export class DefontanaController {
  constructor(private readonly defontanaService: DefontanaService) {}
}
