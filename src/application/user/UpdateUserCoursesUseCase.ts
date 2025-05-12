import { add } from 'date-fns/fp';
import { CalendarDate } from '../../domain/CalendarDate.js';
import { ID } from '../../domain/Id.js';
import { EnrollmentService } from '../../domain/user/EnrollmentService.js';

import { UserRepository } from '../../domain/user/UserRepository.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type CourseConfig = {
  id: ID;
  registrationDate: CalendarDate;
  expirationDate: CalendarDate;
};

interface UpdateUserCourseUseCaseProps {
  userId: ID;
  addedCourses: CourseConfig[] | null;
  removedCourses: ID[] | null;
}

export class UpdateUserCourseUseCase implements UseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  async execute({
    addedCourses,
    removedCourses,
    userId,
  }: UpdateUserCourseUseCaseProps): Promise<
    Either<UserNotFoundError, undefined>
  > {
    const user = await this.userRepository.ofId(userId);

    if (!user) {
      return left(new UserNotFoundError());
    }

    if (!removedCourses && !addedCourses) {
      return left(new Error('No courses to add or remove'));
    }

    const errors: Error[] = [];
    if (addedCourses) {
      for (const course of addedCourses) {
        const r = await this.enrollmentService.enrollUser(
          user.data.id,
          course.id,
          course.registrationDate,
          course.expirationDate,
        );

        if (r.isLeft()) {
          errors.push(r.value);
        }
      }

      const addedCoursesWithUserId = {
        userId,
        courses: addedCourses,
      };

      user.updateUserCourses(addedCoursesWithUserId);
    }

    if (removedCourses) {
      for (const courseId of removedCourses) {
        const r = await this.enrollmentService.unenrollUser(
          user.data.id,
          courseId,
        );

        if (r.isLeft()) {
          errors.push(r.value);
        }
      }
    }

    if (errors.length > 0) {
      return left(new Error(errors.map((e) => e.message).join(';')));
    }

    return right(undefined);
  }
}
