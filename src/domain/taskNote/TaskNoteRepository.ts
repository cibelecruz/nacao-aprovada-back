import { ID } from '../Id.js';
import { TaskNote } from './TaskNote.js';

export interface TaskNoteRepository {
  create(user: TaskNote): Promise<void>;
  save(user: TaskNote): Promise<void>;
  ofId(id: ID): Promise<TaskNote | null>;
}
