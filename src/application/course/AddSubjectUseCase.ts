import { CourseRepository } from '../../domain/course/CourseRepository.js';
import { ID } from '../../domain/Id.js';
import { SubjectRepository } from '../../domain/subject/SubjectRepository.js';
import { CourseNotFoundError } from '../../errors/CourseNotFoundError.js';
import { Either, left, right } from '../../shared/utils/Either.js';

export class AddSubjectUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly subjectRepository: SubjectRepository,
  ) {}

  async execute(courseId: ID, subjectId: ID): Promise<Either<Error, void>> {
    const course = await this.courseRepository.ofId(courseId);
    if (!course) {
      return left(new CourseNotFoundError());
    }

    const subject = await this.subjectRepository.ofId(subjectId);
    if (!subject) {
      return left(new Error('Subject not found'));
    }

    const courseSubject = {
      id: subject.data.id,
      active: true,
      relevance: 1,
      topics: subject.data.topics.map((topic) => ({
        id: topic.id,
        relevance: 1,
        active: true,
      })),
    };

    course.addSubject(courseSubject);

    await this.courseRepository.save(course);

    return right(undefined);
  }
}
