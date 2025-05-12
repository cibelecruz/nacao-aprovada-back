import { ID } from '../../domain/Id.js';
import { SubjectRepository } from '../../domain/subject/SubjectRepository.js';
import { Topic } from '../../domain/subject/Topic.js';
import { SubjectNotFoundError } from '../../errors/SubjectNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

export class RegisterSubjectCustomizationsUseCase implements UseCase {
  constructor(
    private readonly subjectRepository: SubjectRepository,
  ) {}

  async execute(
    subjectId: ID,
    topics: Topic[],
  ): Promise<Either<Error, undefined>> {
    const subject = await this.subjectRepository.ofId(subjectId);
    if (!subject) {
      return left(new SubjectNotFoundError());
    }

    subject.setTopics(topics);

    await this.subjectRepository.save(subject);

    return right(undefined);
  }
}
