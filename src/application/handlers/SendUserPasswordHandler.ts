import { htmlForSendPassword } from './htmlForSendPassword.js';
import { resend } from '../../infrastructure/services/resend/index.js';

export class SendUserPasswordHandler {
  async sendPasswordForEmail({
    userEmail,
    userName,
    userPassword,
  }: {
    userEmail: string;
    userPassword: string;
    userName: string;
  }) {
    try {
      const mail = process.env.EMAIL;
      const emailHtml = htmlForSendPassword({
        name: userName,
        password: userPassword,
      });

      if (!mail) {
        return {
          error: 'EMAIL environment variable is not configured',
          success: false,
        };
      }

      if (!resend) {
        console.warn('Resend service not available. Email not sent.');
        return {
          error: 'Email service not configured (RESEND_API_KEY missing)',
          success: false,
        };
      }

      const { data, error } = await resend.emails.send({
        from: mail,
        to: userEmail,
        subject: 'Seu acesso a Nação Aprovada',
        html: emailHtml,
      });

      if (error) {
        console.error('Resend API error:', error);
        return {
          error: error.message || 'Failed to send email',
          success: false,
        };
      }

      return { data, success: true };
    } catch (error) {
      console.error('SendUserPasswordHandler error:', error);
      return {
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
        success: false,
      };
    }
  }
}
