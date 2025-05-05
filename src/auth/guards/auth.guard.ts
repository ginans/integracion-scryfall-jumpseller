import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Payload } from 'src/auth/interface/payload.interface';
import { UsersService } from 'src/modules/users/users.service';
import { jwtConstants } from '../constants';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private readonly userService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) throw new BadRequestException('Token es requerido');
    try {
      const payload: Payload = await this.jwtService.verifyAsync(token, {
        secret: jwtConstants.secret,
      });
      const User = await this.userService.findByEmail(payload.email);
      if (!User.isActive) {
        throw new UnauthorizedException(
          `Usuario ${User.email} está desactivado`,
        );
      }
      request['user'] = payload;
    } catch (error) {
      throw new UnauthorizedException(error.message);
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}