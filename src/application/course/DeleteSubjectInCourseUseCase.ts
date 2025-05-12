import { CourseRepository } from '../../domain/course/CourseRepository.js';
import { ID } from '../../domain/Id.js';
import { CourseNotFoundError } from '../../errors/CourseNotFoundError.js';
import { SubjectNotFoundError } from '../../errors/SubjectNotFoundError.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type DeleteSubjectInCourseRequest = {
  courseId: ID;
  subjectId: ID;
};

export class DeleteSubjectInCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute({
    courseId,
    subjectId,
  }: DeleteSubjectInCourseRequest): Promise<
    Either<CourseNotFoundError | SubjectNotFoundError, void>
  > {
    const course = await this.courseRepository.ofId(courseId);

    if (!course) {
      return left(new CourseNotFoundError());
    }

    const subjectIndex = course.data.subjects.findIndex((subject) =>
      subject.id.equals(subjectId),
    );

    if (subjectIndex === -1) {
      return left(new SubjectNotFoundError());
    }

    course.data.subjects.splice(subjectIndex, 1);

    await this.courseRepository.save(course);

    return right(undefined);
  }
}
