import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Base } from './Base.js';

class PerformanceBySubject {
  @prop({ required: true })
  topicId: string;

  @prop({ required: true })
  taskId: string;

  @prop({ required: true })
  incorrectAmount: number;

  @prop({ required: true })
  correctAmount: number;
}
@modelOptions({ schemaOptions: { collection: 'userDailyProgress' } })
export class UserDailyProgressDB extends Base {
  @prop({ required: true })
  userId: string;

  @prop({ required: true })
  date: string;

  @prop()
  completedTasks: string[];

  @prop()
  aggregatedStudyTime: number;

  @prop()
  subjectsStudied: string[];

  @prop({ type: () => [PerformanceBySubject], _id: false })
  performances: PerformanceBySubject[];

  @prop()
  totalCorrectAmount?: number;

  @prop()
  totalIncorrectAmount?: number;
}

export const UserDailyProgressModel = getModelForClass(UserDailyProgressDB);
