import { Injectable } from '@nestjs/common';
import { MailerOptionsFactory, MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

@Injectable()
export class SendGridConfigService implements MailerOptionsFactory {
  createMailerOptions(): MailerOptions {
    return {
      transport: {
        service: 'SendGrid',
        auth: {
          user: 'filinigor@yandex.ru',
          pass: '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',
        },
      },
      defaults: {
        from: '"No Reply" <noreply@example.com>',
      },
      template: {
        dir: join(__dirname, '../../mail/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    };
  }
}
