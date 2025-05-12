import type { ID } from '../Id.js';
import type { HelpContent } from './HelpContent.js';

export interface HelpContentRepository {
  create(notification: HelpContent): Promise<void>;
  ofId(id: ID): Promise<HelpContent | null>;
  save(notication: HelpContent): Promise<void>;
  delete(id: ID): Promise<void>;
  fetchAll(): Promise<HelpContent[]>;
}
