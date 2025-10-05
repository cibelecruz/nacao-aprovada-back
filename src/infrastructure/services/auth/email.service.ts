import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export async function sendWelcomeEmail(to: string, name: string, product: string) {
  const msg = {
    to,
    from: process.env.EMAIL_FROM as string,
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
      <p>
        <a href="https://nacaoaprovada.vercel.app/login">👉 Entrar na plataforma</a>
      </p>
      <p>Se for seu primeiro acesso, clique em <b>"Esqueci minha senha"</b> para criar sua senha.</p>
    `,
  };

  await sgMail.send(msg);
  console.log(`E-mail enviado para ${to}`);
}