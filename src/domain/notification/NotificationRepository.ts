import type { ID } from '../Id.js';
import type { Notification } from './Notification.js';

export interface NotificationRepository {
  create(notification: Notification): Promise<void>;
  ofId(id: ID): Promise<Notification | null>;
  save(notication: Notification): Promise<void>;
  ofUserId(userId: ID): Promise<Notification[] | null>;
  delete(id: ID): Promise<void>;
  fetchAll(): Promise<Notification[]>;
}
