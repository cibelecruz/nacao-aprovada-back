import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Base } from './Base.js';

@modelOptions({ schemaOptions: { collection: 'hotmartPostbacks' } })
export class HotmartPostbackDB extends Base {
  @prop({ required: true })
  payload: object;
  @prop({ required: true })
  status: string;
}

export const HotmartPostbackModel = getModelForClass(HotmartPostbackDB);
