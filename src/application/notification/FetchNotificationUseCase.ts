import type { ID } from '../../domain/Id.js';
import { Notification } from '../../domain/notification/Notification.js';
import type { NotificationRepository } from '../../domain/notification/NotificationRepository.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

export class FetchNotificationUseCase implements UseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(userId: ID): Promise<Either<Error, Notification[]>> {
    const notifications = await this.notificationRepository.ofUserId(userId);

    if (!notifications) {
      return left(new Error('Notifications not found'));
    }

    return right(notifications);
  }
}
