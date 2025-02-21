import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}
  private readonly transmitter = process.env.SMTP_USER;
  private readonly url_app = process.env.URL_APP;

  changePassword(email: string, firstName: string, lastName: string, token: string) {
    try {
      //TODO: Evitar que el mail bote el servidor
      this.mailerService.sendMail({
        to: email,
        from: this.transmitter,
        subject: 'Solicitud de Cambio de Contraseña',
        text: 'Cambio de Contraseña',
        html: `<div style="font-family: Arial, sans-serif; color: #333;">
          <h2>Hola ${firstName} ${lastName},</h2>
          <p>Hemos recibido una solicitud para cambiar tu contraseña. Por favor, haz clic en el siguiente enlace para proceder con el cambio:</p>
          <p><a href="${this.url_app}new-password?t=${token}" style="color: #1a73e8;">Cambiar Contraseña</a></p>
          <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
        </div>`,
      });
    } catch (error) {
      console.error(error);
    }
  }
}