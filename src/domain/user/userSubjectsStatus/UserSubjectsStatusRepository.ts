import { ID } from '../../Id.js';
import { UserSubjectsStatus } from './UserSubjectsStatus.js';

export interface UserSubjectsStatusRepository {
  create(userSubjectsStatus: UserSubjectsStatus): Promise<void>;
  ofId(userId: ID, courseId: ID): Promise<UserSubjectsStatus | null>;
  save(userSubjectsStatus: UserSubjectsStatus): Promise<void>;
  delete(userId: ID, courseId: ID): Promise<void>;
}
