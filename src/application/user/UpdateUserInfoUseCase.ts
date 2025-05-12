import { ID } from '../../domain/Id.js';
import { Name } from '../../domain/user/Name.js';
import { UserRepository } from '../../domain/user/UserRepository.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type UpdateUserInfoData = {
  userId: ID;
  name?: Name;
  age?: number;
  jobPosition?: string;
};

export class UpdateUserInfoUseCase implements UseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    userInfo: UpdateUserInfoData,
  ): Promise<Either<UserNotFoundError, undefined>> {
    const user = await this.userRepository.ofId(userInfo.userId);

    if (!user) {
      return left(new UserNotFoundError());
    }

    if (userInfo.name) {
      user.updateName(userInfo.name);
    }

    if (userInfo.age) {
      user.updateAge(userInfo.age);
    }

    if (userInfo.jobPosition) {
      user.updateCurrentJobPosition(userInfo.jobPosition);
    }

    await this.userRepository.save(user);

    return right(undefined);
  }
}
