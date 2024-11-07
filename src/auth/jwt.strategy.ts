import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { EnvConfiguration } from 'src/config/app.config';
import { Payload } from './interface/payload.interface';
import { UserInterface } from 'src/users/interface/user.interface';
import { AuthService } from './auth.service';

@Injectable() // Asegúrate de que tu estrategia es un proveedor injectable
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: EnvConfiguration().jwt_secret,
    });
  }

  async validate(payload: Payload): Promise<UserInterface> {
    const user = await this.authService.validateUser(payload.sub);
    return user;
  }
}
