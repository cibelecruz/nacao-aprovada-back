import { getModelForClass, prop } from '@typegoose/typegoose';
import { Base } from './Base.js';
import type { UUID } from 'crypto';

export class FlashCardDB extends Base {
  @prop({ required: true })
  content: string;

  @prop()
  result: boolean;

  @prop({ required: true })
  userId: UUID;

  @prop({ required: true, default: false })
  isReady: boolean;

  @prop()
  readyAt?: Date;
}

export const FlashCardModel = getModelForClass(FlashCardDB);
