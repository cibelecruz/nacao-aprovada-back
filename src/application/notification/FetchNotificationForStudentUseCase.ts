import { ID } from '../../domain/Id.js';
import { NotificationRepository } from '../../domain/notification/NotificationRepository.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { Notification } from '../../domain/notification/Notification.js';

type FetchNotificationForStudentData = {
  courseIds: ID[];
};

export class FetchNotificationForStudentUseCase {
  constructor(
    private readonly notificationRepository: NotificationRepository,
  ) {}

  async execute({
    courseIds,
  }: FetchNotificationForStudentData): Promise<Either<Error, Notification[]>> {
    try {
      const notifications = await this.notificationRepository.fetchAll();

      const today = new Date().setHours(0,0,0,0);

      const filteredNotifications = notifications
        .filter((notification) => {
          return (
            notification.data.target === 'all' ||
            (notification.data.courseId !== undefined &&
              courseIds.some((courseId) =>
                courseId.equals(notification.data.courseId as ID),
              ))
          );
        })
        .filter((notification) => notification.data.active) // Verificar se está ativo
        .filter((notification) => {
          // Filtrar notificações da data atual
          const notificationStartDate = new Date(notification.data.startDate).getTime()
          const notificationEndDate = new Date(notification.data.endDate).getTime()

          return today >= notificationStartDate && today <= notificationEndDate
        });

      return right(filteredNotifications);
    } catch (error) {
      return left(new Error('Error fetching notifications'));
    }
  }
}
