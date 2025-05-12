import { CourseRepository } from '../../domain/course/CourseRepository.js';
import { ID } from '../../domain/Id.js';
import { CourseNotFoundError } from '../../errors/CourseNotFoundError.js';
import { SubjectNotFoundError } from '../../errors/SubjectNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type UpdateSubjectStatusRequestBody = {
  courseId: ID;
  subjectId: ID;
  active: boolean;
};

export class UpdateSubjectStatusByCourseUseCase implements UseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(
    data: UpdateSubjectStatusRequestBody,
  ): Promise<Either<CourseNotFoundError | SubjectNotFoundError, boolean>> {
    const course = await this.courseRepository.ofId(data.courseId);

    if (!course) {
      return left(new CourseNotFoundError());
    }

    const subject = course.data.subjects.find((v) =>
      v.id.equals(data.subjectId),
    );

    if (!subject) {
      return left(new SubjectNotFoundError());
    }

    subject.active = data.active;

    await this.courseRepository.save(course);

    return right(true);
  }
}
