import { ID } from '../Id.js';
import { Subject } from './Subject.js';

export interface SubjectRepository {
  create(subject: Subject): Promise<void>;
  ofId(id: ID): Promise<Subject | null>;
  save(subject: Subject): Promise<void>;
  ofTopicId(topicId: ID): Promise<string | null>;
  ofTopicIds(topicIds: string[]): Promise<Record<string, Subject | null>>;
  ofName(name: string): Promise<Subject | null>;
}
