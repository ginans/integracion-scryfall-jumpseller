import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Auth } from './entities/auth.entity';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { Payload } from './interface/payload.interface';
import * as argon2 from 'argon2';
import { UsersService } from 'src/users/users.service';
import { ReplacePassDto } from './dto/replace-pass.dto';
import { MailService } from '../mail/mail.service';
import { RecoverPassDto } from './dto/recover.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private logger = new Logger('AuthService');
  constructor(
    @InjectModel(Auth.name)
    private readonly model: Model<Auth>,
    private jwtService: JwtService,
    private readonly userService: UsersService,
    private readonly mailService: MailService,
  ) {}
  private async createRegister(login: { email: string }) {
    const newDocument = new this.model(login);
    await newDocument.save();
  }
  async compare(passOrigin: string, hashPassword: string): Promise<boolean> {
    return await argon2.verify(hashPassword, passOrigin);
  }
  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password);
  }
  async createToken(payload: { sub: string; email: string; name: string }) {
    return await this.jwtService.signAsync(payload);
  }
  async validateToken(token: string): Promise<Payload> {
    try {
      const cutToken = token.split(' ').pop();
      return await this.jwtService.verifyAsync(cutToken);
    } catch (error) {
      Logger.error('Error al validar token', error);
      throw new UnauthorizedException('Token inválido');
    }
  }
  async signIn(email: string, password: string) {
    const User = await this.userService.findByEmail(email);
    if (!User) throw new BadRequestException('Correo o contraseña incorrecto');
    const validarPass = await this.compare(password, User.password);
    if (!validarPass)
      throw new UnauthorizedException('Correo/contraseña incorrecto');
    if (!User.status) throw new UnauthorizedException('Usuario deshabilitado');
    const payload = {
      sub: User._id.toString(),
      email: User.email,
      name: User.name,
    };
    const access_token = await this.createToken(payload);
    await this.createRegister({ email });
    await this.userService.updateLogin(User._id.toString());
    return {
      access_token,
      user: {
        id: User._id,
        email: User.email,
        name: User.name,
        role: User.role,
      },
    };
  }
  async recoverPass(body: RecoverPassDto) {
    const user = await this.userService.findByEmail(body.email);
    if (!user)
      return { message: 'Enviamos a tu correo el método de recuperación' };
    const payload = {
      sub: user._id.toHexString(),
      email: user.email,
      name: user.name,
    };
    const token = await this.createToken(payload);
    this.mailService.sendMail(user.email, user.name, token);
    return {
      message: 'Enviamos a tu correo el método de recuperación',
    };
  }
  async changePass(body: ReplacePassDto, token: string) {
    const { password } = body;
    const user = await this.validateToken(token);
    const userDB = await this.userService.findByEmail(user.email);
    const hashPassword = await this.hashPassword(password);
    userDB.password = hashPassword;
    await this.userService.updatePass(userDB._id.toHexString(), hashPassword);
    return {
      message: 'Contraseña cambiada correctamente',
    };
  }
  async validateUser(id: string): Promise<User> {
    const user = await this.userService.findById(id);
    if (!user) throw new UnauthorizedException('Token inválido');
    if (!user.status) throw new UnauthorizedException('Usuario deshabilitado');
    user.password = undefined;
    return user;
  }
}
