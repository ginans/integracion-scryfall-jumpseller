import { ProviderInterface } from '../interface/provider.interface';

export class CreateProviderDto implements ProviderInterface {
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
  phone: string;
}
