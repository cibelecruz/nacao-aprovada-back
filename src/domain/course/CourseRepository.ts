import { Course } from '../course/Course.js';
import { ID } from '../Id.js';

export interface CourseRepository {
  create(course: Course): Promise<void>;
  ofId(id: ID): Promise<Course | null>;
  save(course: Course): Promise<void>;
  ofIds(ids: ID[]): Promise<Course[]>;
}
