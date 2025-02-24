import { UserRole } from '../enums/user-role.enum';
export interface BaseUser {
  isActive: boolean;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  rememberToken: string;
  lastLogin: Date;
}

export interface UserInterface extends BaseUser {
  _id: string;
}
