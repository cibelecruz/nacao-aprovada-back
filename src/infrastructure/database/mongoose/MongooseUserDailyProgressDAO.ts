import { ID } from '../../../domain/Id.js';
import {
  UserDailyProgressDB,
  UserDailyProgressModel,
} from './models/UserDailyProgressModel.js';

export type UserDailyProgressPayload = {
  userId: string;
  date: string;
  completedTasks?: string[];
  aggregatedStudyTime?: number;
  subjectsStudied?: string[];
  performances?: {
    taskId: string;
    topicId: string;
    incorrectAmount: number;
    correctAmount: number;
  }[];
  totalCorrectAmount?: number;
  totalIncorrectAmount?: number;
};

type AggregateUserDailyProgress = {
  _id: string;
  performances: {
    taskId: string;
    topicId: string;
    incorrectAmount: number;
    correctAmount: number;
  }[];
};

export class MongooseUserDailyProgress {
  async create(userDailyProgress: UserDailyProgressPayload): Promise<void> {
    await UserDailyProgressModel.create(userDailyProgress);
  }

  async update(
    userDailyProgress: Omit<UserDailyProgressPayload, 'userId' | 'date'> & {
      _id: string;
    },
  ): Promise<void> {
    await UserDailyProgressModel.updateOne(
      { _id: userDailyProgress._id },
      userDailyProgress,
    ).exec();
  }

  async findByUserId(userId: ID): Promise<UserDailyProgressDB[]> {
    return await UserDailyProgressModel.find({ userId }).lean().exec();
  }

  async findByUserIdAndDate(
    userId: string,
    date: string,
  ): Promise<UserDailyProgressDB | null> {
    return await UserDailyProgressModel.findOne({ userId, date }).lean().exec();
  }

  async aggregatePerUser(pastDays: number) {
    return await UserDailyProgressModel.aggregate<AggregateUserDailyProgress>()
      .match({
        date: {
          $gte: new Date(
            new Date().setDate(new Date().getDate() - pastDays),
          ).toISOString(),
        },
      })
      .unwind('$performances')
      .group({
        _id: '$userId',
        performances: {
          $push: '$performances',
        },
      })
      .exec();
  }

  async getAll() {
    return await UserDailyProgressModel.find().lean().exec();
  }
}
