import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { Base } from './Base.js';

@modelOptions({ schemaOptions: { collection: 'notifications' } })
export class NotificationDB extends Base {
  @prop({ required: true, default: true })
  active: boolean;

  @prop({ required: true })
  title: string;

  @prop({ required: true })
  description: string;

  @prop({ required: false })
  courseId: string;

  @prop({ required: true })
  target: 'all' | 'one';

  @prop({ required: true })
  startDate: string;

  @prop({ required: true })
  endDate: string;

  @prop({ required: true })
  userId: string;
}

export const NotificationModel = getModelForClass(NotificationDB);
