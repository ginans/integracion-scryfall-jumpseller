import { PartialType } from '@nestjs/mapped-types';
import { CreateDefontanaDto } from './create-defontana.dto';

export class UpdateDefontanaDto extends PartialType(CreateDefontanaDto) {}
