// import { Module } from '@nestjs/common';
// import { MailService } from './mail.service';

// @Module({
//   providers: [MailService],
//   exports: [MailService],
// })
// export class MailModule {}

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
          host: config.get("MAIL_HOST"),
          secure: config.get("MAIL_SECURE") === "true",
          port: config.get("MAIL_PORT"),
          auth: {
            user: config.get("MAIL_USER"),
            pass: config.get("MAIL_PASSWORD"),
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

