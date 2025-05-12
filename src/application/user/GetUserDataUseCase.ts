import { ID } from '../../domain/Id.js';
import type { User } from '../../domain/user/User.js';
import { UserRepository } from '../../domain/user/UserRepository.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type GetUserDataUseCaseRequest = {
  userId: ID;
};

export class GetUserDataUseCase implements UseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    userId,
  }: GetUserDataUseCaseRequest): Promise<Either<UserNotFoundError, User>> {
    const user = await this.userRepository.ofId(userId);

    if (!user) {
      return left(new UserNotFoundError());
    }

    return right(user);
  }
}
