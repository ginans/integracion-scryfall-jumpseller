import {
  Controller,
  Post,
  Body,
  Headers,
  Get,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RecoverPassDto } from './dto/recover.dto';
import { ReplacePassDto } from './dto/replace-pass.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
export class AuthController {
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
    return this.authService.recoverPass(body);
  }
  @Post('new-password')
  @UseGuards(JwtAuthGuard)
  changePass(
    @Body() body: ReplacePassDto,
    @Headers('Authorization') token: string,
  ) {
    return this.authService.changePass(body, token);
  }
}
