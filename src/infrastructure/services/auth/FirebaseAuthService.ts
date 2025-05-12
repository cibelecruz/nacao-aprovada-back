import { getAuth } from 'firebase-admin/auth';
import {
  AuthService,
  CreateUserData,
} from '../../../application/auth/AuthService.js';
import { Either, left, right } from '../../../shared/utils/Either.js';
import { InvalidAuthTokenError } from '../../../errors/InvalidAuthTokenError.js';

export class FirebaseAuthService implements AuthService {
  async createUser(data: CreateUserData) {
    const auth = getAuth();

    const user = await auth.createUser({
      email: data.email.value,
      displayName: data.name?.value,
      password: data.password.value,
      uid: data.id.value,
    });

    await auth.setCustomUserClaims(user.uid, {
      role: data.role.value === 'admin' ? 'coach' : 'student',
    });
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const auth = getAuth();
      await auth.setCustomUserClaims(userId, { deleted: true });
    } catch (error) {
      console.error('Erro ao definir custom claim:', error);
    }
  }

  async rollbackUser(userId: string): Promise<void> {
    try {
      const auth = getAuth();
      await auth.setCustomUserClaims(userId, { deleted: false });
      console.log("Custom claim 'deleted: false' definida com sucesso.");
    } catch (error) {
      console.error('Erro ao redefinir custom claim:', error);
    }
  }

  async decodeToken(
    token: string,
  ): Promise<Either<InvalidAuthTokenError, string>> {
    const auth = getAuth();
    try {
      const { uid } = await auth.verifyIdToken(token.replace('Bearer ', ''));
      return right(uid);
    } catch {
      return left(new InvalidAuthTokenError());
    }
  }
}
