import { ID } from '../../domain/Id.js';
import { Email } from '../../domain/user/Email.js';
import { Name } from '../../domain/user/Name.js';
import { Password } from '../../domain/user/Password.js';
import type { Role } from '../../domain/user/Role.js';
import { InvalidAuthTokenError } from '../../errors/InvalidAuthTokenError.js';
import { Either } from '../../shared/utils/Either.js';

export type CreateUserData = {
  id: ID;
  email: Email;
  name?: Name;
  password: Password;
  role: Role;
};

export interface AuthService {
  createUser(data: CreateUserData): Promise<void>;
  decodeToken(token: string): Promise<Either<InvalidAuthTokenError, string>>;
}
