interface UserDataProps {
  name: string;
  password: string;
}

export function htmlForSendPassword({ name, password }: UserDataProps) {
  return `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sua Senha</title>
  </head>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #ffffff; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0F1729;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #1a2642; border-radius: 8px; border: 1px solid #2a3754;">
          <tr>
              <td style="padding: 20px;">
                  <h1 style="color: #FFB800; text-align: center; margin-bottom: 30px;">SUA NOVA SENHA</h1>
                  <p style="margin-bottom: 20px;">Olá ${name},</p>
                  <p>Conforme solicitado, aqui está sua nova senha:</p>
                  <div style="background-color: #2a3754; border: 1px solid #FFB800; border-radius: 4px; padding: 15px; margin: 20px 0; text-align: center;">
                      <strong style="font-size: 18px; color: #FFB800;">${password}</strong>
                  </div>
                  <p>Por razões de segurança, recomendamos que você altere sua senha após o seu próximo login.</p>
                  <p>Se você não solicitou esta alteração de senha, por favor, entre em contato conosco imediatamente.</p>
                  <p style="margin-top: 30px; color: #FFB800;">Atenciosamente,<br>Equipe de Suporte</p>
              </td>
          </tr>
      </table>
      <p style="text-align: center; font-size: 12px; color: #8895ac; margin-top: 20px;">
          Este é um e-mail automático, por favor não responda.
      </p>
  </body>
  </html>
  `;
}
