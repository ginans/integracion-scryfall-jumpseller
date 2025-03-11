import { Injectable, Logger } from "@nestjs/common"
import { MailerService } from "@nestjs-modules/mailer"
import * as fs from "fs"
import * as path from "path"
import * as handlebars from "handlebars"
import { AppController } from "src/app.controller"

@Injectable()
export class MailService {
  private readonly logger = new Logger(AppController.name);
  constructor(private mailerService: MailerService) {}

  private readonly transmitter = process.env.SMTP_USER
  private readonly url_app = process.env.URL_APP_BACKEND;

  async changePassword(email: string, name: string, rememberToken: string) {
    try {
      // Leer la plantilla
      const templatePath = path.resolve(__dirname, "../mail/templates/reset-password-mail.hbs")
      this.logger.log("template", templatePath)
      const templateSource = fs.readFileSync(templatePath, "utf-8")

      // Compilar la plantilla con Handlebars
      const template = handlebars.compile(templateSource)

      // Preparar los datos para la plantilla
      const resetUrl = `${this.url_app}new-password?rt=${rememberToken}`//poner url del front para cambio de contraseña
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
      try{

        await this.mailerService.sendMail({
          to: email,
          from: this.transmitter,
          // from: process.env.SMTP_USER,
          subject: "Restablece tu contraseña",
          html: html,
        })
        this.logger.log("Correo de recuperación enviado a:", this.transmitter)
      }catch(error){
        this.logger.error("Error al enviar correo de recuperación:", error)
      }

      return true
    } catch (error) {
      console.error("Error al enviar correo de recuperación:", error)
      return false
    }
  }
}




