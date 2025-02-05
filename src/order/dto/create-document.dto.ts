import { IsString } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  provider: string;

  @IsString()
  costCenter: string;

  @IsString()
  import: string;

  @IsString()
  invoiceNumber: string;

  costs: [
    {
      account: string;
      amount: number;
      amountCLP: number;
      costType: string;
      currency: string;
      exchangeRate: number;
      id: number;
    }
  ]
}