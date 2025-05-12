import { prop, getModelForClass, modelOptions } from '@typegoose/typegoose';
import { Base } from './Base.js';

@modelOptions({ schemaOptions: { collection: 'helpContent' } })
export class HelpContentDB extends Base {
  @prop({ required: true })
  title: string;

  @prop({ required: true })
  content: string;

  @prop({ required: false })
  videoUrl: string;

  @prop({ required: false, default: true })
  iaAccess: boolean;

  @prop({ required: true })
  userId: string;
}

export const HelpContentModel = getModelForClass(HelpContentDB);
