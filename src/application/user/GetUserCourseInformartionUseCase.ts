import type { CalendarDate } from '../../domain/CalendarDate.js';
import type { CourseRepository } from '../../domain/course/CourseRepository.js';
import { ID } from '../../domain/Id.js';
import { UserRepository } from '../../domain/user/UserRepository.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type GetUserCourseInformationUseCaseRequest = {
  userId: ID;
};

type GetUserCourseInformationUseCaseResponse = {
  id: ID;
  name: string;
  expirationDate: CalendarDate;
};

export class GetUserCourseInformationUseCase implements UseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository,
  ) {}

  async execute({
    userId,
  }: GetUserCourseInformationUseCaseRequest): Promise<
    Either<UserNotFoundError, GetUserCourseInformationUseCaseResponse[]>
  > {
    const user = await this.userRepository.ofId(userId);

    if (!user) {
      return left(new UserNotFoundError());
    }

    const courses = await Promise.all(
      user.data.courses.map(async (course) => {
        const courseInfo = await this.courseRepository.ofId(course.id);

        if (courseInfo) {
          return {
            id: course.id,
            name: courseInfo.data.name,
            expirationDate: course.expirationDate,
          };
        }

        return null;
      }),
    );

    const filteredCourses = courses.filter((course) => course !== null);

    return right(filteredCourses);
  }
}
