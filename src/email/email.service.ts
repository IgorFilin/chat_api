import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private email: string;
  private password: string;
  constructor(private configService: ConfigService) {
    this.email = configService.get('EMAIL_USERNAME');
    this.password = configService.get('EMAIL_PASSWORD');
  }
  async sendConfirmationEmail(email: string, confirmationCode: string) {
    const transporter = nodemailer.createTransport({
      host: 'smtp.mail.ru', // сервер SMTP для Mail.ru
      port: 465, // порт для SSL
      secure: true,
      auth: {
        user: this.email,
        pass: this.password,
      },
    });

    const mailOptions = {
      from: 'Your App <chat.info@inbox.ru>',
      to: email,
      subject: 'Confirm your email',
      text: `Your confirmation code is ${confirmationCode}.`,
    };

    const result = await transporter.sendMail(mailOptions);
    return result;
  }
}
