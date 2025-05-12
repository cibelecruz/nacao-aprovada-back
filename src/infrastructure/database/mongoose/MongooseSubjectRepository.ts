import { SubjectModel } from './models/SubjectModel.js';
import { Subject } from '../../../domain/subject/Subject.js';
import { SubjectRepository } from '../../../domain/subject/SubjectRepository.js';
import { ID } from '../../../domain/Id.js';
import { SubjectName } from '../../../domain/subject/SubjectName.js';
import { Topic } from '../../../domain/subject/Topic.js';

export class MongooseSubjectRepository implements SubjectRepository {
  async create(subject: Subject): Promise<void> {
    await new SubjectModel({
      _id: subject.data.id.value,
      name: subject.data.name.value,
      topics: subject.data.topics.map((topic) => ({
        id: topic.id.value,
        name: topic.name.value,
        taskTypes: topic.taskTypes,
        active: topic.active,
      })),
      deleted: subject.data.deleted,
    }).save();
  }

  async save(subject: Subject): Promise<void> {
    await SubjectModel.updateOne(
      { _id: subject.data.id.value },
      {
        name: subject.data.name.value,
        topics: subject.data.topics.map((topic) => ({
          id: topic.id.value,
          name: topic.name.value,
          taskTypes: topic.taskTypes,
          active: topic.active,
        })),
        deleted: subject.data.deleted,
      },
    );
  }

  async ofTopicId(topicId: ID) {
    const subjectData = await SubjectModel.findOne({
      'topics.id': topicId.value,
    });

    if (!subjectData) return null;

    return subjectData.name;
  }

  async ofId(id: ID): Promise<Subject | null> {
    const subjectData = await SubjectModel.findOne({
      _id: id.value,
    })
      .lean()
      .exec();

    if (!subjectData) {
      return null;
    }

    return Subject.create({
      id: ID.create(subjectData._id),
      name: SubjectName.create(subjectData.name).value as SubjectName,
      topics: subjectData.topics.map((topic) => {
        const topicIdOrError = ID.parse(topic.id);

        if (topicIdOrError.isLeft()) {
          throw new Error('ID do tópico inválido');
        }

        return new Topic(
          topicIdOrError.value,
          topic.active,
          SubjectName.create(topic.name).value as SubjectName,
          topic.taskTypes,
        );
      }),
    });
  }

  async ofTopicIds(
    ids: (string | ID)[],
  ): Promise<Record<string, Subject | null>> {
    const idsToFind = ids.map((id) => (typeof id === 'string' ? id : id.value));

    const subjectsData = await SubjectModel.find({
      'topics.id': { $in: idsToFind },
    })
      .lean()
      .exec();

    const result: Record<string, Subject | null> = {};

    for (const id of idsToFind) {
      const subjectData = subjectsData.find((subject) =>
        subject.topics.some((topic) => topic.id === id),
      );

      if (!subjectData) {
        result[id] = null;
        continue;
      }

      result[id] = Subject.create({
        id: ID.create(subjectData._id),
        name: SubjectName.create(subjectData.name).value as SubjectName,
        topics: subjectData.topics.map((topic) => {
          const topicIdOrError = ID.parse(topic.id);

          if (topicIdOrError.isLeft()) {
            throw new Error('ID do tópico inválido');
          }

          return new Topic(
            topicIdOrError.value,
            topic.active,
            SubjectName.create(topic.name).value as SubjectName,
            topic.taskTypes,
          );
        }),
      });
    }

    return result;
  }

  async ofName(name: string): Promise<Subject | null> {
    const subjectData = await SubjectModel.findOne({
      name,
    })
      .lean()
      .exec();

    if (!subjectData) {
      return null;
    }

    return Subject.create({
      id: ID.create(subjectData._id),
      name: SubjectName.create(subjectData.name).value as SubjectName,
      topics: subjectData.topics.map((topic) => {
        const topicIdOrError = ID.parse(topic.id);

        if (topicIdOrError.isLeft()) {
          throw new Error('ID do tópico inválido');
        }

        return new Topic(
          topicIdOrError.value,
          topic.active,
          SubjectName.create(topic.name).value as SubjectName,
          topic.taskTypes,
        );
      }),
    });
  }
}
