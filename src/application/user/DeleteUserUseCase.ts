import { ID } from '../../domain/Id.js';

import { UserRepository } from '../../domain/user/UserRepository.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

export class DeleteUserUseCase implements UseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(Id: ID): Promise<Either<UserNotFoundError, undefined>> {
    const user = await this.userRepository.ofId(Id);

    if (!user) {
      return left(new UserNotFoundError());
    }

    user.delete();

    await this.userRepository.save(user);

    return right(undefined);
  }
}
