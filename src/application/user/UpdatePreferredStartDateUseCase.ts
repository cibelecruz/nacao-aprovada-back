import { CalendarDate } from '../../domain/CalendarDate.js';
import { User } from '../../domain/user/User.js';
import { UserRepository } from '../../domain/user/UserRepository.js';
import { InvalidPreferredStartDateError } from '../../errors/InvalidPreferredStartDateError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

export class UpdatePreferredStartDateUseCase implements UseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    user: User,
    preferredStartDate: CalendarDate,
  ): Promise<Either<InvalidPreferredStartDateError, boolean>> {
    const resultOrError = user.setPreferredStartDate(preferredStartDate);
    if (resultOrError.isLeft()) {
      return left(resultOrError.value);
    }
    await this.userRepository.save(user);
    return right(true);
  }
}
