import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';
import { BaseUser } from '../interface/user.interface';

@Schema({ timestamps: true })
export class User implements BaseUser {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.User })
  role: UserRole;

  @Prop({ default: null })
  rememberToken: string;

  @Prop({ default: null })
  lastLogin: Date | null;
}
export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
