import { CalendarDate } from '../../domain/CalendarDate.js';
import { ID } from '../../domain/Id.js';
import { Email } from '../../domain/user/Email.js';
import { Phone } from '../../domain/user/Phone.js';
import { UserRepository } from '../../domain/user/UserRepository.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type UpdateStudentInfoData = {
  userId: ID;
  email?: Email;
  phone?: Phone;
  course?: {
    id: ID;
    registrationDate: CalendarDate;
    expirationDate: CalendarDate;
  };
};

export class UpdateStudentInfoUseCase implements UseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    userInfo: UpdateStudentInfoData,
  ): Promise<Either<UserNotFoundError, undefined>> {
    const user = await this.userRepository.ofId(userInfo.userId);

    if (!user) {
      return left(new UserNotFoundError());
    }

    if (userInfo) {
      user.updateStudentInfo(userInfo);
    }

    await this.userRepository.save(user);

    return right(undefined);
  }
}
