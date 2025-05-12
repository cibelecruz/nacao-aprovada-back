import type { ID } from '../../domain/Id.js';
import { Notification } from '../../domain/notification/Notification.js';
import type { NotificationRepository } from '../../domain/notification/NotificationRepository.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface NotificationData {
  title: string;
  description: string;
  courseId?: ID;
  target: 'all' | 'one';
  startDate: string;
  endDate: string;
  userId: ID;
  active?: boolean;
}

export class CreateNotificationUseCase implements UseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    notification: NotificationData,
  ): Promise<Either<Error, { id: ID }>> {
    const notificationOrError = Notification.create({
      startDate: notification.startDate,
      endDate: notification.endDate,
      description: notification.description,
      title: notification.title,
      target: notification.target,
      userId: notification.userId,
      active: notification.active,
      courseId: notification.courseId,
    });

    if (notificationOrError.isLeft()) {
      return left(new Error());
    }

    await this.notificationRepository.create(notificationOrError.value);

    return right({ id: notificationOrError.value.data._id });
  }
}
