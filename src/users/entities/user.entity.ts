import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';
import { BaseUser } from '../interface/user.interface';

@Schema({ timestamps: true })
export class User implements BaseUser {
  @Prop({ type: Types.ObjectId, default: () => new Types.ObjectId() })
  _id: Types.ObjectId;

  @Prop({ default: true })
  status: boolean;

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, enum: UserRole, default: UserRole.User })
  role: UserRole;

  @Prop({ default: null })
  lastLogin: Date | null;
}
export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
