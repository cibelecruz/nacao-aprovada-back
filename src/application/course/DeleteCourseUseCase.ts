import { CourseRepository } from '../../domain/course/CourseRepository.js';
import { ID } from '../../domain/Id.js';
import type { EnrollmentService } from '../../domain/user/EnrollmentService.js';
import { Either, left, right } from '../../shared/utils/Either.js';

class DeleteCourseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeleteCourseError';
  }
}

export class DeleteCourseUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  async execute(id: ID): Promise<Either<Error, ID>> {
    try {
      const course = await this.courseRepository.ofId(id);
      if (!course) {
        return left(new DeleteCourseError('Course not found'));
      }
      const resultOrError =
        await this.enrollmentService.unrollAllUsersFromCourseId(id);

      if (resultOrError.isLeft()) {
        return left(
          new DeleteCourseError('Error unenrolling users from course'),
        );
      }

      course.delete();

      await this.courseRepository.save(course);
      return right(id);
    } catch (error) {
      return left(new DeleteCourseError('Error deleting course'));
    }
  }
}
