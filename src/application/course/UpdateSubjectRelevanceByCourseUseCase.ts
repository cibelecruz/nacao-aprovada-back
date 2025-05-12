import { CourseRepository } from '../../domain/course/CourseRepository.js';
import { ID } from '../../domain/Id.js';
import { CourseNotFoundError } from '../../errors/CourseNotFoundError.js';
import { SubjectNotFoundError } from '../../errors/SubjectNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type UpdateSubjectRelevanceRequestBody = {
  courseId: ID;
  subjectId: ID;
  relevance: number;
};

export class UpdateSubjectRelevanceByCourseUseCase implements UseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(
    data: UpdateSubjectRelevanceRequestBody,
  ): Promise<Either<CourseNotFoundError | SubjectNotFoundError, boolean>> {
    const course = await this.courseRepository.ofId(data.courseId);

    if (!course) {
      return left(new CourseNotFoundError());
    }

    const updateResult = course.updateSubjectRelevance(
      data.subjectId,
      data.relevance,
    );
    if (updateResult.isLeft()) {
      return left(updateResult.value);
    }

    await this.courseRepository.save(course);

    return right(true);
  }
}
