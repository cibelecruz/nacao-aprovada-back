import type { ID } from '../../domain/Id.js';
import type { NotificationRepository } from '../../domain/notification/NotificationRepository.js';
import { NotificationNotFoundError } from '../../errors/NotificationNotFoundError.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

type UpdateNotificationData = {
  id: ID;
  title?: string;
  description?: string;
  courseId?: ID;
  target?: 'all' | 'one';
  endDate?: string;
  startDate?: string;
  active?: boolean;
};

export class UpdateNotificationUseCase implements UseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    notificationInfo: UpdateNotificationData,
  ): Promise<Either<NotificationNotFoundError, undefined>> {
    const notification = await this.notificationRepository.ofId(
      notificationInfo.id,
    );

    if (!notification) {
      return left(new NotificationNotFoundError());
    }

    if (notificationInfo.title) {
      notification.updateTitle(notificationInfo.title);
    }

    if (notificationInfo.description) {
      notification.updateDescription(notificationInfo.description);
    }

    if (notificationInfo.courseId) {
      notification.updateCourse(notificationInfo.courseId);
    }

    if (notificationInfo.target) {
      switch (notificationInfo.target) {
        case 'all':
          notification.updateTarget(notificationInfo.target);
          notification.updateCourse(undefined);
          break;
        case 'one':
          notification.updateTarget(notificationInfo.target);
          notification.updateCourse(notificationInfo.courseId);
          break;
      }
    }

    if (notificationInfo.startDate) {
      notification.updateStartDate(notificationInfo.startDate);
    }

    if (notificationInfo.endDate) {
      notification.updateEndDate(notificationInfo.endDate);
    }

    if (notificationInfo.active) {
      notification.updateActive(notificationInfo.active);
    }

    await this.notificationRepository.save(notification);

    return right(undefined);
  }
}
