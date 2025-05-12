import { ID } from '../Id.js';
import { Task } from './Task.js';

export interface TaskRepository {
  create(task: Task): Promise<void>;
  save(task: Task): Promise<void>;
  ofId(id: ID): Promise<Task | null>;
  topicsThatHaveTasks(userId: ID): Promise<ID[]>;
  delete(id: ID): Promise<void>;
  deleteByUserAndCourse(userId: ID, courseId: ID): Promise<void>;
}
