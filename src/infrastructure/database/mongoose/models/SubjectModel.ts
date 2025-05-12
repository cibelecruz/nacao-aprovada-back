import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Base } from './Base.js';
import { TaskType } from '../../../../domain/task/Task.js';

export class TopicOnSubject {
  @prop({ required: true })
  name: string;

  @prop({ required: true })
  id: string;

  @prop({ required: true })
  active: boolean;

  @prop({ type: () => [String], required: true })
  taskTypes: TaskType[];
}

@modelOptions({ schemaOptions: { collection: 'subjects' } })
export class SubjectDB extends Base {
  @prop({ required: true })
  name: string;

  @prop({ required: true, type: () => [TopicOnSubject], _id: false })
  topics: TopicOnSubject[];

  @prop()
  deleted: boolean;
}

export const SubjectModel = getModelForClass(SubjectDB);
