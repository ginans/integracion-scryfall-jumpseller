import { UserRole } from '../enums/user-role.enum';

export interface UserInterface {
  _id?: string;
  status: boolean;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  lastLogin: Date;
}
