import { ID } from '../Id.js';
import { User } from './User.js';

export interface UserRepository {
  create(user: User): Promise<void>;
  save(user: User): Promise<void>;
  ofId(id: ID): Promise<User | null>;
  registerManyUsers(users: User[]): Promise<void>;
  listStudents(): Promise<User[]>;
  listStudentsByCourse(courseId: ID): Promise<User[]>;
  getAllStudentsExcept(userId: ID): Promise<User[]>;
}
