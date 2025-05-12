import type { UUID } from 'crypto';
import { ID } from '../../../domain/Id.js';
import { Notification } from '../../../domain/notification/Notification.js';
import type { NotificationRepository } from '../../../domain/notification/NotificationRepository.js';
import { NotificationModel } from './models/NotificationModel.js';

export class MongooseNotificationRepository implements NotificationRepository {
  async fetchAll(): Promise<Notification[]> {
    const notifications = await NotificationModel.find().lean().exec();

    const notificationsData = notifications
      .map((notification) =>
        Notification.create({
          startDate: notification.startDate,
          endDate: notification.endDate,
          description: notification.description,
          title: notification.title,
          target: notification.target,
          userId: ID.create(notification.userId as UUID),
          active: notification.active,
          courseId: ID.create(notification.courseId as UUID),
          id: ID.create(notification._id),
        }),
      )
      .filter((notification) => notification.isRight())
      .map((either) => either.value);

    return notificationsData;
  }

  async delete(id: ID): Promise<void> {
    const result = await NotificationModel.deleteOne()
      .where({ _id: id.value })
      .exec();

    if (result.deletedCount === 0) {
      throw new Error('Notification not found.');
    }
  }

  async ofUserId(userId: ID): Promise<Notification[] | null> {
    const notifications = await NotificationModel.where({
      userId: userId.value,
    });

    if (!notifications) {
      return null;
    }

    const notificationsData = notifications
      .map((notification) =>
        Notification.create({
          startDate: notification.startDate,
          endDate: notification.endDate,
          description: notification.description,
          title: notification.title,
          target: notification.target,
          userId: ID.create(notification.userId as UUID),
          active: notification.active,
          courseId: ID.create(notification.courseId as UUID),
          id: ID.create(notification._id),
        }),
      )
      .filter((notification) => notification.isRight())
      .map((either) => either.value);

    return notificationsData;
  }

  async create(notification: Notification): Promise<void> {
    await new NotificationModel({
      _id: notification.data._id,
      active: notification.data.active,
      courseId: notification.data.courseId,
      createdAt: new Date(),
      startDate: notification.data.startDate,
      endDate: notification.data.endDate,
      description: notification.data.description,
      target: notification.data.target,
      title: notification.data.title,
      userId: notification.data.userId,
    }).save();
  }
  async ofId(id: ID): Promise<Notification | null> {
    const notificationData = await NotificationModel.findOne({
      _id: id.value,
    })
      .lean()
      .exec();

    if (!notificationData) {
      return null;
    }

    const notification = Notification.create({
      id: ID.create(notificationData._id),
      title: notificationData.title,
      startDate: notificationData.startDate,
      endDate: notificationData.endDate,
      description: notificationData.description,
      target: notificationData.target,
      userId: ID.create(notificationData.userId as UUID),
      active: notificationData.active,
      courseId: ID.create(notificationData.courseId as UUID),
    });

    if (notification.isLeft()) {
      return null;
    }

    return notification.value;
  }
  async save(notification: Notification): Promise<void> {
    await NotificationModel.updateOne(
      { _id: notification.data._id.value },
      {
        title: notification.data.title,
        description: notification.data.description,
        userId: notification.data.userId.value,
        active: notification.data.active,
        startDate: notification.data.startDate,
        endDate: notification.data.endDate,
        courseId: notification.data.courseId?.value,
        target: notification.data.target,
      },
    ).exec();
  }
}
