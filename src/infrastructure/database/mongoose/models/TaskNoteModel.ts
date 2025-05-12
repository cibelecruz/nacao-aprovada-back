import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { Base } from './Base.js';
import { UUID } from 'crypto';

@modelOptions({ schemaOptions: { collection: 'taskNotes' } })
export class TaskNoteDB extends Base {
  @prop({ required: true })
  taskId: UUID;

  @prop({ type: String })
  note?: string;

  @prop({ type: Number })
  correctCount?: number;

  @prop({ type: Number })
  incorrectCount?: number;

  @prop({ required: true })
  userId: UUID;
}

export const TaskNoteModel = getModelForClass(TaskNoteDB);
