import type { ID } from '../../domain/Id.js';
import type { UserRepository } from '../../domain/user/UserRepository.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import type { UserDailyProgressDB } from '../../infrastructure/database/mongoose/models/UserDailyProgressModel.js';
import type { MongooseUserDailyProgress } from '../../infrastructure/database/mongoose/MongooseUserDailyProgressDAO.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

export class DailyPerformanceUseCase implements UseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userDailyProgressRepository: MongooseUserDailyProgress,
  ) {}
  async execute(
    userId: ID,
  ): Promise<Either<UserNotFoundError, UserDailyProgressDB[]>> {
    const user = await this.userRepository.ofId(userId);

    if (!user) {
      left(new UserNotFoundError());
    }

    const dailyProgress =
      await this.userDailyProgressRepository.findByUserId(userId);

    return right(dailyProgress);
  }
}
