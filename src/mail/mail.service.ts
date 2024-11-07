import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}
  private readonly transmitter = process.env.SMTP_USER;
  private readonly url_app = process.env.URL_APP;

  sendMail(emailUser: string, nameUser: string, token: string) {
    try {
      //TODO: Evitar que el mail bote el servidor
      this.mailerService.sendMail({
        to: emailUser,
        from: this.transmitter,
        subject: 'Cambio de contraseña',
        text: 'Bienvenido',
        html: `<div style="display:flex; flex-direction: column;">
        <p>Hola ${nameUser}!, Por favor revisa el siguiente link para cambiar tu contraseña</p>
        <br>
        <a href="${this.url_app}new-password?t=${token}"><p>Cambiar contraseña</p></a>
        </div>`,
      });
    } catch (error) {
      console.error(error);
    }
  }
  sendFinallyTask(emailUser: string, nameUser: string, message: string) {
    this.mailerService.sendMail({
      to: emailUser,
      from: this.transmitter,
      subject: 'Procesar margenes',
      text: `Hola ${nameUser}, ${message}`,
    });
  }
}