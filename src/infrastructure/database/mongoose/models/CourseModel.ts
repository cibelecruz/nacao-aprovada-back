import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Base } from './Base.js';
import { UUID } from 'crypto';

export class CourseSubjectsTopic {
  @prop({ required: true })
  id: UUID;

  @prop({ required: true })
  active: boolean;

  @prop({ required: true })
  relevance: number;
}

export class CourseSubject {
  @prop({ required: true })
  id: UUID;

  @prop({ required: true })
  relevance: number;

  @prop({ required: true })
  active: boolean;

  @prop({ required: true, type: () => [CourseSubjectsTopic], _id: false })
  topics: CourseSubjectsTopic[];
}

@modelOptions({ schemaOptions: { collection: 'courses' } })
export class CourseDB extends Base {
  @prop({ required: true })
  name: string;

  @prop({ required: true, type: () => [CourseSubject], _id: false })
  subjects: CourseSubject[];

  @prop({ required: false })
  deleted?: boolean;
}

export const CourseModel = getModelForClass(CourseDB);
