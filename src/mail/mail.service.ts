// import { Injectable } from '@nestjs/common';
// import { MailerService } from '@nestjs-modules/mailer';

// @Injectable()
// export class MailService {
//   constructor(private readonly mailerService: MailerService) {}
//   private readonly transmitter = process.env.SMTP_USER;
//   private readonly url_app = process.env.URL_APP;

//   changePassword(email: string, name: string, token: string) {
//     try {
//       //TODO: Evitar que el mail bote el servidor
//       this.mailerService.sendMail({
//         to: email,
//         from: this.transmitter,
//         subject: 'Solicitud de Cambio de Contraseña',
//         text: 'Cambio de Contraseña',
//         html: `<div style="font-family: Arial, sans-serif; color: #333;">
//           <h2>Hola ${name},</h2>
//           <p>Hemos recibido una solicitud para cambiar tu contraseña. Por favor, haz clic en el siguiente enlace para proceder con el cambio:</p>
//           <p><a href="${this.url_app}new-password?t=${token}" style="color: #1a73e8;">Cambiar Contraseña</a></p>
//           <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>
//         </div>`,
//       });

//     } catch (error) {
//       console.error(error);
//     }
//   }
// }

import { Injectable } from "@nestjs/common"
import type { MailerService } from "@nestjs-modules/mailer"
import * as fs from "fs"
import * as path from "path"
import * as handlebars from "handlebars"

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  private readonly transmitter = process.env.SMTP_USER
  private readonly url_app = process.env.URL_APP;

  async changePassword(email: string, name: string, token: string) {
    try {
      // Leer la plantilla
      const templatePath = path.resolve("@/src/mail/templates/recuperacion.hbs")
      const templateSource = fs.readFileSync(templatePath, "utf-8")

      // Compilar la plantilla con Handlebars
      const template = handlebars.compile(templateSource)

      // Preparar los datos para la plantilla
      const resetUrl = `${this.url_app}new-password?t=${token}`
      const data = {
        name: name,
        resetUrl: resetUrl,
        companyName: "Magic Forever",
        currentYear: new Date().getFullYear(),
        companyAddress: "Avenida Viel 1690, , Santiago, Metropolitana, Chile",
      }

      // Renderizar la plantilla con los datos
      const html = template(data)

      // Enviar el correo
      await this.mailerService.sendMail({
        to: email,
        from: this.transmitter,
        subject: "Restablece tu contraseña",
        html: html,
      })

      return true
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error)
      return false
    }
  }
}




