import { ID } from '../../domain/Id.js';
import { Role } from '../../domain/user/Role.js';
import { User } from '../../domain/user/User.js';
import { UserRepository } from '../../domain/user/UserRepository.js';
import { InsufficientPrivilegesError } from '../../errors/InsufficientPrivilegesError.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

export class UpdateUserRoleUseCase implements UseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    userId,
    role,
    requester,
  }: {
    userId: ID;
    role: Role;
    requester: User;
  }): Promise<
    Either<UserNotFoundError | InsufficientPrivilegesError, undefined>
  > {
    const user = await this.userRepository.ofId(userId);

    if (!user) {
      return left(new UserNotFoundError());
    }

    const resultOrError = user.promoteTo(role, requester);
    
    if (resultOrError.isLeft()) {
        return left(resultOrError.value);
    }

    await this.userRepository.save(user);

    return right(resultOrError.value);
  }
}
