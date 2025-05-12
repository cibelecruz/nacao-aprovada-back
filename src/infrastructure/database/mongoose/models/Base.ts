import { randomUUID, UUID } from 'crypto';
import { prop, modelOptions } from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: {
    timestamps: false,
    optimisticConcurrency: true,
  },
})
export abstract class Base {
  @prop({ required: true, default: () => randomUUID() })
  _id: UUID;

  @prop({ default: () => new Date() })
  createdAt: Date;

  @prop({ default: () => new Date() })
  updatedAt: Date;
}
