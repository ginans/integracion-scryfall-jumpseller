import { ClientInterface } from '../interface/client.interface';

export class CreateClientDto implements ClientInterface {
  legalCode: string;
  fileid: string;
  name: string;
  address: string;
  district: string;
  email: string;
  business: string;
  rubroId: string;
  giro: string;
  city: string;
}
