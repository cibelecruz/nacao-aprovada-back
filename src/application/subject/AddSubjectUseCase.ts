import { ID } from '../../domain/Id.js';
import { SubjectRepository } from '../../domain/subject/SubjectRepository.js';
import { Subject } from '../../domain/subject/Subject.js';
import { SubjectName } from '../../domain/subject/SubjectName.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { InvalidNameError } from '../../errors/InvalidNameError.js';
import { TaskType } from '../../domain/task/Task.js';
import { Topic } from '../../domain/subject/Topic.js';
import { CreateSubjectError } from '../../errors/CreateSubjectError.js';

export class AddSubjectUseCase {
  constructor(private readonly subjectRepository: SubjectRepository) {}

  async execute(
    name: string,
    topics: { name: string; taskTypes: TaskType[] }[] = [],
  ): Promise<Either<InvalidNameError | CreateSubjectError, ID>> {
    try {
      const nameOrError = SubjectName.create(name);
      if (nameOrError.isLeft()) {
        return left(nameOrError.value);
      }

      const subjectName = nameOrError.value;

      const topicResultsOrError: Either<Error, Topic>[] = topics.map((topicData) => {
        const topicNameOrError = SubjectName.create(topicData.name);
        if (topicNameOrError.isLeft()) {
          return left(topicNameOrError.value);
        }
        const topicName = topicNameOrError.value;

        const topicId = ID.create();

        return right(new Topic(topicId, true, topicName, topicData.taskTypes));
      });

      const invalidTopics: Error[] = [];

      const validTopics: Topic[] = [];

      for (const topicResultOrError of topicResultsOrError) {
        if (topicResultOrError.isLeft()) {
          invalidTopics.push(topicResultOrError.value);
        } else {
          validTopics.push(topicResultOrError.value);
        }
      }

      if (invalidTopics.length > 0) {
        return left(new CreateSubjectError('Invalid topics'));
      }

      const subject = Subject.create({
        id: ID.create(),
        name: subjectName,
        topics: validTopics,
      });

      await this.subjectRepository.create(subject);

      return right(subject.data.id);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        return left(new CreateSubjectError(error.message));
      } else {
        console.error('Unknown error details:', error);
        return left(
          new CreateSubjectError(
            'Unknown error occurred while creating subject',
          ),
        );
      }
    }
  }
}
