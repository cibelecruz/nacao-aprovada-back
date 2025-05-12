import { User } from '../../domain/user/User.js';
import { UserRepository } from '../../domain/user/UserRepository.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, right } from '../../shared/utils/Either.js';

export class CompleteOnboardingUseCase implements UseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(user: User): Promise<Either<never, boolean>> {
    user.completeOnboarding();
    await this.userRepository.save(user);
    return right(true);
  }
}
