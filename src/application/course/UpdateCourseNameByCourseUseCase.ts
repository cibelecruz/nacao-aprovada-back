import { CourseName } from '../../domain/course/CourseName.js';
import { CourseRepository } from '../../domain/course/CourseRepository.js';
import { ID } from '../../domain/Id.js';
import { CourseNotFoundError } from '../../errors/CourseNotFoundError.js';
import { SubjectNotFoundError } from '../../errors/SubjectNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type UpdateCourseNameRequestBody = {
  courseId: ID;
  courseName: CourseName;
};

export class UpdateCourseNameByCourseUseCase implements UseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(
    data: UpdateCourseNameRequestBody,
  ): Promise<Either<CourseNotFoundError | SubjectNotFoundError, boolean>> {
    const course = await this.courseRepository.ofId(data.courseId);

    if (!course) {
      return left(new CourseNotFoundError());
    }

    course.updateName(data.courseName);

    await this.courseRepository.save(course);

    return right(true);
  }
}
