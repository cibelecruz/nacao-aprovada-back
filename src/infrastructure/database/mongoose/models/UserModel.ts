import { getModelForClass, modelOptions, prop } from '@typegoose/typegoose';
import { Base } from './Base.js';
import { UUID } from 'crypto';

class UserCourseDB {
  @prop({ required: true })
  id: UUID;

  @prop({ required: true })
  registrationDate: string;

  @prop({ required: true })
  expirationDate: string;
}

class UserStudyAvailabilityDB {
  @prop({ required: true })
  sunday: number;

  @prop({ required: true })
  monday: number;

  @prop({ required: true })
  tuesday: number;

  @prop({ required: true })
  wednesday: number;

  @prop({ required: true })
  thursday: number;

  @prop({ required: true })
  friday: number;

  @prop({ required: true })
  saturday: number;
}

@modelOptions({ schemaOptions: { collection: 'users' } })
export class UserDB extends Base {
  @prop({ required: true })
  email: string;

  @prop({ required: true })
  name: string;

  @prop()
  phone?: string;

  @prop({ type: () => [UserCourseDB], required: true, _id: false })
  courses: UserCourseDB[];

  @prop()
  role?: string;

  @prop()
  onboardingComplete?: boolean;

  @prop({ required: true })
  preferredStartDate: string;

  @prop({ type: () => UserStudyAvailabilityDB, required: true, _id: false })
  studyAvailability: UserStudyAvailabilityDB;

  @prop()
  age?: number;

  @prop()
  cpf?: string;

  @prop()
  jobPosition?: string;

  @prop()
  imageUrl?: string;

  @prop()
  imagePath?: string;

  @prop({ default: false })
  deleted: boolean;

  @prop({ required: false, default: 'monthly' })
  frequencySendPerformanceReport: string;
}

export const UserModel = getModelForClass(UserDB);
