import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Base } from './Base.js';

@modelOptions({ schemaOptions: { collection: 'userEvaluation' } })
export class UserEvaluationDB extends Base {
  @prop({ required: true })
  subject: string;

  @prop({ required: true })
  numberOfHits: number;

  @prop({ required: true })
  numberOfError: number;

  @prop({ required: true })
  userEmail: string;

  @prop({ required: true })
  status: string;
}

export const UserEvaluationModel = getModelForClass(UserEvaluationDB);
