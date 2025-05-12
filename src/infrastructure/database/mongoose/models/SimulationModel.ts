import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Base } from './Base.js';
import type { UUID } from 'crypto';

class SubjectInSimulationDB {
  @prop({ required: true })
  id: UUID;

  @prop({ required: true })
  totalQuestions: number;

  @prop({ required: true })
  correctQuestions: number;

  @prop({ required: true })
  name: string;
}

@modelOptions({ schemaOptions: { collection: 'simulations' } })
export class SimulationDB extends Base {
  @prop({ required: true })
  userId: UUID;

  @prop({ required: true })
  name: string;

  @prop({ required: true })
  subjects: SubjectInSimulationDB[];

  @prop({ required: true })
  date: string;
}

export const SimulationModel = getModelForClass(SimulationDB);
