import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Base } from './Base.js';
import { SubjectDB } from './SubjectModel.js';

class SubjectTopicsCustomizations {
  @prop({ required: true })
  topicId: string;

  @prop()
  active?: boolean;

  @prop({ type: () => [String], default: undefined })
  taskTypes?: string[];
}

@modelOptions({ schemaOptions: { collection: 'subjectTopics' } })
export class SubjectTopicsDB extends Base {
  @prop({ required: true, ref: () => SubjectDB })
  subjectId: string;

  @prop({
    required: true,
    type: () => [SubjectTopicsCustomizations],
    _id: false,
  })
  customizations: SubjectTopicsCustomizations[];
}

export const SubjectTopicsModel = getModelForClass(SubjectTopicsDB);
