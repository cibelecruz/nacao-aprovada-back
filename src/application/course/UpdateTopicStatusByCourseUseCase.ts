import { CourseRepository } from '../../domain/course/CourseRepository.js';
import { ID } from '../../domain/Id.js';
import { CourseNotFoundError } from '../../errors/CourseNotFoundError.js';
import { TopicNotFoundError } from '../../errors/TopicNotFoundError.js';
import { UnauthorizedTopicManipulation } from '../../errors/UnauthorizedTopicManipulation.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type UpdateTopicRequestBody = {
  courseId: ID;
  topicId: ID;
  active: boolean;
};

export class UpdateTopicStatusByCourseUseCase implements UseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(
    data: UpdateTopicRequestBody,
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

    course.updateTopicStatus(course, data.topicId, data.active);

    await this.courseRepository.save(course);

    return right(true);
  }
}
