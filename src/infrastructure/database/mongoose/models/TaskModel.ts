import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Base } from './Base.js';
import { UUID } from 'crypto';

class TaskNoteDb {
  @prop()
  comment?: string;

  @prop()
  correctCount?: number;

  @prop()
  incorrectCount?: number;

  @prop()
  taskId: UUID;

  @prop()
  userId: UUID;

  @prop()
  createdAt: Date;
}

@modelOptions({ schemaOptions: { collection: 'tasks' } })
export class TaskDB extends Base {
  @prop({ required: true })
  ownerId: UUID;

  @prop({ required: true })
  courseId: UUID;

  @prop({ required: true })
  topicId: UUID;

  @prop()
  completedOn?: string;

  @prop()
  elapsedTimeInSeconds?: number;

  @prop()
  finished?: boolean;

  @prop({ required: true })
  type: string;

  @prop({ required: true })
  cycle: number;

  @prop()
  plannedDate?: string;

  @prop()
  isExtra?: boolean;

  @prop()
  estimatedTimeToComplete?: number;

  @prop({ type: () => TaskNoteDb, _id: false })
  note?: TaskNoteDb;
}

export const TaskModel = getModelForClass(TaskDB);
