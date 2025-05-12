import { User } from '../../domain/user/User.js';
import { UserRepository } from '../../domain/user/UserRepository.js';
import { UserStudyAvailability } from '../../domain/user/UserStudyAvailability.js';
import { UseCase } from '../../shared/UseCase.js';

export class UpdateStudyAvailabilityUseCase implements UseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(
    user: User,
    studyAvailability: UserStudyAvailability,
  ): Promise<boolean> {
    user.setStudyAvailability(studyAvailability);
    await this.userRepository.save(user);
    return true;
  }
}
