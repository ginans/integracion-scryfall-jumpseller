import { Module } from "@nestjs/common"
import { MailerModule } from "@nestjs-modules/mailer/"
import { HandlebarsAdapter } from "@nestjs-modules/mailer/dist/adapters/handlebars.adapter"
import { MailService } from "./mail.service"
import { ConfigService } from "@nestjs/config"

@Module({
  imports: [
    MailerModule,
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get("SMTP_HOST"),
          secure: config.get("SMTP_SECURE") === "true",
          port: config.get("SMTP_PORT"),
          auth: {
            user: config.get("SMTP_USER"),
            pass: config.get("SMTP_PASSWORD"),
          },
        },
        defaults: {
          from: `"${config.get("MAIL_FROM_NAME")}" <${config.get("MAIL_FROM_ADDRESS")}>`,
        },
        template: {
          dir: process.cwd() + "/templates/",
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}

