import { FastifyReply, FastifyRequest } from 'fastify';
import { FirebaseAuthService } from '../../services/auth/FirebaseAuthService.js';
import { ID } from '../../../domain/Id.js';
import { UserNotFoundError } from '../../../errors/UserNotFoundError.js';
import { MongooseUserRepository } from '../../database/mongoose/MongooseUserRepository.js';

const publicUrls = ['/ping', '/register-user'];

export const firebaseAuthMiddleware = async (
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  if (publicUrls.includes(request.routeOptions.url ?? '')) {
    return;
  }
  try {
    const token = request.headers.authorization;
    if (!token) {
      return reply.status(401).send('Unauthorized');
    }
    const authService = new FirebaseAuthService();
    const userIdOrError = await authService.decodeToken(token);
    if (userIdOrError.isLeft()) {
      return reply.status(403).send(userIdOrError.value);
    }
    const userRepository = new MongooseUserRepository();
    const user = await userRepository.ofId(
      ID.parse(userIdOrError.value).value as ID,
    );
    if (!user) {
      return reply.status(404).send(new UserNotFoundError());
    }
    request.user = user;
  } catch {
    return reply.status(500).send('Internal server error on auth');
  }
};
