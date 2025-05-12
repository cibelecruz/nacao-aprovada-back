import type { CourseRepository } from '../../domain/course/CourseRepository.js';
import type { ID } from '../../domain/Id.js';

import { UserRepository } from '../../domain/user/UserRepository.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type ExportOnboardingUseCaseRequest = {
  userId: ID;
};

type ExportOnboardingUseCaseResponse = {
  name: string;
  age?: number;
  email: string;
  courses: string;
  jobPosition?: string;
};

export class ExportOnboardingUseCase implements UseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository,
  ) {}

  async execute({
    userId,
  }: ExportOnboardingUseCaseRequest): Promise<
    Either<UserNotFoundError, ExportOnboardingUseCaseResponse>
  > {
    const user = await this.userRepository.ofId(userId);

    if (!user) {
      return left(new UserNotFoundError());
    }

    const courses = await Promise.all(
      user.data.courses.map(async ({ id: courseId }) => {
        const course = await this.courseRepository.ofId(courseId);

        if (!course) {
          return null;
        }

        return {
          name: course.data.name,
        };
      }),
    );

    const exportData = {
      name: user.data.name.value,
      age: user.data.age,
      email: user.data.email.value,
      courses: courses.map((course) => course!.name).join(', '),
      jobPosition: user.data.jobPosition,
    };

    return right(exportData);
  }
}
