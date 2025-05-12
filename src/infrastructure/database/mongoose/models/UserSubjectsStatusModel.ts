import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Base } from './Base.js';
import { UserDB } from './UserModel.js';
import { CourseDB } from './CourseModel.js';

class UserCourseTopicCustomizations {
  @prop({ required: true })
  topicId: string;

  @prop()
  active?: boolean;

  @prop({ type: () => [String], default: undefined })
  taskTypes?: string[];
}

class UserCourseSubjectCustomizations {
  @prop({ required: true })
  subjectId: string;

  @prop()
  active?: boolean;

  @prop({ type: () => [UserCourseTopicCustomizations], _id: false, default: undefined })
  topicCustomizations?: UserCourseTopicCustomizations[];
}

class UserHitsAndMisses {
  @prop({ required: true })
  topicId: string;

  @prop()
  hits?: number;

  @prop()
  misses?: number;
}
@modelOptions({ schemaOptions: { collection: 'userSubjectsStatus' } })
export class UserSubjectsStatusDB extends Base {
  @prop({ required: true, ref: () => UserDB })
  userId: string;

  @prop({ required: true, ref: () => CourseDB })
  courseId: string;

  @prop()
  lastStudy?: string;

  @prop({
    required: true,
    type: () => [UserCourseSubjectCustomizations],
    _id: false,
  })
  customizations: UserCourseSubjectCustomizations[];

  @prop({ required: true, type: () => [UserHitsAndMisses], _id: false })
  hitsAndMisses: UserHitsAndMisses[];
}

export const UserSubjectsStatusModel = getModelForClass(UserSubjectsStatusDB);
