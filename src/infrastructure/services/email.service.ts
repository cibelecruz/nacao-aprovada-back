// arquivo de serviço para enviar e-mails

import sgMail from '@sendgrid/mail';

// Configura o SendGrid com a API Key do ambiente (Railway)
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

/**
 * Serviço que envia o e-mail de boas-vindas após a compra.
 * @param to E-mail do aluno
 * @param name Nome do aluno
 * @param product Nome do produto/curso
 */
export async function sendWelcomeEmail(to: string, name: string, product: string) {
  const msg = {
    to, // destinatário
    from: process.env.EMAIL_FROM as string, // remetente
    subject: `Acesso liberado: ${product}`,
    text: `
Olá, ${name}!

Seu acesso ao curso "${product}" foi liberado.

Acesse: https://nacaoaprovada.vercel.app/login
Se for seu primeiro acesso, clique em "Esqueci minha senha" para definir uma senha.
    `,
    html: `
      <p>Olá, <strong>${name}</strong>!</p>
      <p>Seu acesso ao curso <b>${product}</b> foi liberado.</p>
      <p><a href="https://nacaoaprovada.vercel.app/login">👉 Entrar na plataforma</a></p>
      <p>Se for seu primeiro acesso, clique em <b>"Esqueci minha senha"</b> para criar sua senha.</p>
    `,
  };

  await sgMail.send(msg); // envia o e-mail
  console.log(`✅ E-mail enviado para ${to}`);
}