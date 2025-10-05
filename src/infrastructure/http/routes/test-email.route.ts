import { Router, Request, Response } from 'express';
import { sendWelcomeEmail } from '../../services/email.service';

const router = Router();

/**
 * Rota para testar envio de e-mail manual.
 * Endpoint: GET /api/test-email
 */
router.get('/test-email', async (req: Request, res: Response) => {
  try {
    await sendWelcomeEmail('coachcibelecruz@gmail.com', 'Cibele', 'Curso de Teste');
    res.status(200).send('E-mail enviado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail:', error);
    res.status(500).send('Erro ao enviar e-mail');
  }
});

export default router;