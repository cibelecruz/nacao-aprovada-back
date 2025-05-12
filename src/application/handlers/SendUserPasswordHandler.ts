import nodemailer, { Transporter } from 'nodemailer';
import { htmlForSendPassword } from './htmlForSendPassword.js';

export class SendUserPasswordHandler {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465 ? true : false,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });
  }

  async sendPasswordForEmail({
    userEmail,
    userName,
    userPassword,
  }: {
    userEmail: string;
    userPassword: string;
    userName: string;
  }) {
    const mail = process.env.EMAIL;
    const emailHtml = htmlForSendPassword({
      name: userName,
      password: userPassword,
    });

    if (!mail) {
      throw new Error('Email not found');
    }

    await this.transporter
      .sendMail({
        from: mail,
        to: userEmail,
        subject: 'Sua senha de acesso',
        html: emailHtml,
      })
      .then(() => console.log(`Email sent to ${userEmail}`))
      .catch((error) => console.error(error));
  }
}
