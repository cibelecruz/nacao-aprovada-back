import type { ID } from '../Id.js';
import type { FlashCard } from './FlashCard.js';

export interface FlashCardRepository {
  create(flashCard: FlashCard): Promise<void>;
  ofId(id: ID): Promise<FlashCard | null>;
  save(flashCard: FlashCard): Promise<void>;
  delete(id: ID): Promise<void>;
  fetchAll(userId: ID): Promise<FlashCard[]>;
  fetchAllIsNotReady(userId: ID): Promise<FlashCard[]>;
}
