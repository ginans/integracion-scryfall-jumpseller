import { UserRole } from '../enums/user-role.enum';
export interface BaseUser {
  isActive: boolean;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  rememberToken: string;
  lastLogin: Date;
}

export interface UserInterface extends BaseUser {
  _id: string;
}
