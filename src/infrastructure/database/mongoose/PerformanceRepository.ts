import { ID } from '../../../domain/Id.js';
import { CourseModel } from './models/CourseModel.js';
import { SubjectModel } from './models/SubjectModel.js';
import { TaskModel } from './models/TaskModel.js';
import { UserModel } from './models/UserModel.js';

export class PerformanceRepository {
  async findInformationByUser(userId: ID) {
    const user = await UserModel.findById(userId).lean().exec();

    const tasksPerUser = await TaskModel.find({ ownerId: userId.value })
      .lean()
      .exec();

    return {
      userInfo: user,
      tasksPerUser: tasksPerUser,
    };
  }

  async topicsOfIds(topicIds: string[]) {
    const subjects = await SubjectModel.find({
      'subjects.topics.id': { $in: topicIds },
    })
      .lean()
      .exec();

    const topics = subjects.flatMap((subject) =>
        subject.topics.filter((topic) =>
          topicIds.includes(topic.id),
        ),
      );

    return topics;
  }
}
