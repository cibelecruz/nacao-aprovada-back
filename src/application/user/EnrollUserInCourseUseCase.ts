import { CalendarDate } from '../../domain/CalendarDate.js';
import { ID } from '../../domain/Id.js';
import { EnrollmentService } from '../../domain/user/EnrollmentService.js';
import { CourseNotFoundError } from '../../errors/CourseNotFoundError.js';
import { UserAlreadyEnrolledInCourse } from '../../errors/UserAlreadyEnrolledInCourseError.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

export class EnrollUserInCourseUseCase implements UseCase {
  constructor(private enrollmentService: EnrollmentService) {}
  async execute(
    userId: ID,
    courseId: ID,
    registrationDate: CalendarDate,
    expirationDate: CalendarDate,
  ): Promise<
    Either<
      UserNotFoundError | CourseNotFoundError | UserAlreadyEnrolledInCourse,
      undefined
    >
  > {
    const result = await this.enrollmentService.enrollUser(
      userId,
      courseId,
      registrationDate,
      expirationDate,
    );
    if (result.isLeft()) {
      return left(result.value);
    }
    return right(undefined);
  }
}
