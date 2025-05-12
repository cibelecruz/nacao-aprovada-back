import type { ID } from '../../domain/Id.js';
import type { UserRepository } from '../../domain/user/UserRepository.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface UpdateFrequencySendEmailReportUseCaseData {
  userId: ID;
  frequency: string;
}

export class UpdateFrequencySendEmailReportUseCase implements UseCase {
  constructor(private readonly userRepository: UserRepository) {}
  async execute({
    frequency,
    userId,
  }: UpdateFrequencySendEmailReportUseCaseData): Promise<
    Either<UserNotFoundError, undefined>
  > {
    const user = await this.userRepository.ofId(userId);

    if (!user) {
      return left(new UserNotFoundError());
    }

    user.updateFrequency(frequency);

    await this.userRepository.save(user);

    return right(undefined);
  }
}
