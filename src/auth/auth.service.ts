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
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UserInterface } from 'src/users/interface/user.interface';

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
  async createRegister(login: { email: string }) {
    const newDocument = new this.model(login);
    await newDocument.save();
  }
  async findAll() {
    return await this.userService.findAll();
  }
  async compare(passOrigin: string, hashPassword: string) {
    return await argon2.verify(hashPassword, passOrigin);
  }
  async hashPassword(password: string) {
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
  async session(token: string) {
    console.log(token);
    return 'ok';
  }
  async signIn(email: string, password: string) {
    const User = await this.userService.findByEmail(email);
    if (!User) throw new BadRequestException('Correo o contraseña incorrecto');
    const validarPass = await this.compare(password, User.password);
    if (!validarPass)
      throw new UnauthorizedException('Correo/contraseña incorrecto');
    if (!User.status) throw new UnauthorizedException('Usuario deshabilitado');
    const { name } = User;
    const payload = {
      sub: User._id,
      email: User.email,
      name,
    };
    const access_token = await this.createToken(payload);
    await this.createRegister({ email });
    await this.userService.updateLogin(User._id);
    return {
      access_token,
      user: {
        id: User._id,
        email: User.email,
        name: User.name,
      },
    };
  }
  async recoverPass(body: RecoverPassDto) {
    const user = await this.userService.findByEmail(body.email);
    if (!user) {
      return {
        message: 'Enviamos a tu correo el método de recuperación',
      };
    }
    const payload = {
      sub: user._id,
      email: user.email,
      name: user.name,
    };
    const token = await this.createToken(payload);
    this.mailService.sendMail(user.email, user.name, token);
    return {
      message: 'Enviamos a tu correo el método de recuperación',
    };
  }
  async changePass(body: ReplacePassDto) {
    const { password, token } = body;
    const user = await this.validateToken(token);
    const userDB = await this.userService.findByEmail(user.email);
    const hashPassword = await this.hashPassword(password);
    userDB.password = hashPassword;
    await this.userService.updatePass(userDB._id, hashPassword);
    return {
      message: 'Contraseña cambiada correctamente',
    };
  }
  async createUser(createUserDto: CreateUserDto, token: string) {
    await this.validateToken(token);
    const user = await this.userService.findByEmail(createUserDto.email);
    if (user) throw new UnauthorizedException('Usuario Ya Existe');
    const randomPassword = this.generateRandomPassword();
    const password = await this.hashPassword(randomPassword);
    const status = true;
    const createUser = {
      ...createUserDto,
      password,
      status,
      rol: 'admin',
      lastLogin: new Date(),
    };
    const userCreate = await this.userService.registerDB(createUser);
    const payload = {
      sub: userCreate._id,
      email: userCreate.email,
      name: userCreate.name,
    };
    const access_token = await this.createToken({
      sub: String(payload.sub),
      email: payload.email,
      name: payload.name,
    });
    try {
      this.mailService.sendMail(
        createUser.email,
        createUser.name,
        access_token,
      );
      return userCreate;
    } catch (error) {
      this.logger.error('Error al enviar correo', error);
      return userCreate;
    }
  }
  generateRandomPassword(): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
  async validateUser(id: string): Promise<UserInterface> {
    const user = await this.userService.findOne(id);
    if (!user.status) throw new UnauthorizedException('Usuario deshabilitado');
    delete user.password;
    return user;
  }
}
