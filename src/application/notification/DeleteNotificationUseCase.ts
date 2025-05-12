import type { ID } from '../../domain/Id.js';
import type { NotificationRepository } from '../../domain/notification/NotificationRepository.js';
import { NotificationNotFoundError } from '../../errors/NotificationNotFoundError.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

type DeleteNotificationData = {
  id: ID;
};

export class DeleteNotificationUseCase implements UseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute(
    notificationInfo: DeleteNotificationData,
  ): Promise<Either<NotificationNotFoundError, undefined>> {
    const notification = await this.notificationRepository.ofId(
      notificationInfo.id,
    );

    if (!notification) {
      return left(new NotificationNotFoundError());
    }

    await this.notificationRepository.delete(notificationInfo.id);

    return right(undefined);
  }
}
