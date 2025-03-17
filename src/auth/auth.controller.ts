import {
  Controller,
  Post,
  Body,
  Headers,
  Get,
  UseGuards,
  Query,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RecoverPassDto } from './dto/recover.dto';
import { ReplacePassDto } from './dto/replace-pass.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { QueryRecover } from './dto/QueryRecover';
import { AppController } from 'src/app.controller';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AppController.name);
  constructor(private readonly authService: AuthService) {}
  @ApiOperation({ summary: 'autenticar usuario con credenciales' })
  @ApiResponse({
    status: 200,
    description: 'Operación exitosa',
  })
  @Post('login')
  signIn(@Body() login: CreateAuthDto) {
    return this.authService.signIn(login.email, login.password);
  }
  @Get('session')
  session(@Headers('Authorization') token: string) {
    return this.authService.validateToken(token);
  }
  @Post('recover_pass')
  SendEmail(@Body() body: RecoverPassDto) {
    this.logger.log("Email recibido:", body.email);
    return this.authService.recoverPass(body);
  }
 
  //deberia tener un guard? token de autorizacion? se supone que 
  // si quieres recuperar contraseña es porque no puedes entrar a la app, no deberia tener token
  @Post('new-password')
  // @UseGuards(JwtAuthGuard)
  changePass(
    @Body() body: ReplacePassDto,
    @Query() query: QueryRecover,
    // @Headers('Authorization') token: string,
  ) {
    return this.authService.changePass(body, query.rt);
  }
}
