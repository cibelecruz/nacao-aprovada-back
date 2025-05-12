import { CourseRepository } from '../../domain/course/CourseRepository.js';
import { ID } from '../../domain/Id.js';
import { CourseNotFoundError } from '../../errors/CourseNotFoundError.js';
import { TopicNotFoundError } from '../../errors/TopicNotFoundError.js';
import { UnauthorizedTopicManipulation } from '../../errors/UnauthorizedTopicManipulation.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type UpdateTopicRelevanceRequestBody = {
  courseId: ID;
  topicId: ID;
  relevance: number;
};

export class UpdateTopicRelevanceByCourseUseCase implements UseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(
    data: UpdateTopicRelevanceRequestBody,
  ): Promise<
    Either<
      CourseNotFoundError | TopicNotFoundError | UnauthorizedTopicManipulation,
      boolean
    >
  > {
    const course = await this.courseRepository.ofId(data.courseId);
    if (!course) {
      return left(new CourseNotFoundError());
    }

    course.updateTopicRelevance(course, data.topicId, data.relevance);

    await this.courseRepository.save(course);

    return right(true);
  }
}
