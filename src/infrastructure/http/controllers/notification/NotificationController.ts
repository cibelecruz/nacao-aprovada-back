import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreateNotificationUseCase } from '../../../../application/notification/CreateNotificationUseCase.js';
import {
  BadRequest,
  Created,
  Forbidden,
  OK,
  type HttpResponse,
} from '../../utils/responseHelpers.js';
import { ID } from '../../../../domain/Id.js';
import type { FetchNotificationUseCase } from '../../../../application/notification/FetchNotificationUseCase.js';
import type { UpdateNotificationUseCase } from '../../../../application/notification/UpdateNotificationUseCase.js';
import type { ChangeStatusNotificationUseCase } from '../../../../application/notification/ChangeStatusNotificationUseCase.js';
import type { DeleteNotificationUseCase } from '../../../../application/notification/DeleteNotificationUseCase.js';
import type { FetchNotificationForStudentUseCase } from '../../../../application/notification/FetchNotificationForStudentUseCase.js';

type NotificationControllerUseCases = {
  createNotificationUseCase: CreateNotificationUseCase;
  fetchNotificationUseCase: FetchNotificationUseCase;
  updateNotificationUseCase: UpdateNotificationUseCase;
  changeStatusNotificationUseCase: ChangeStatusNotificationUseCase;
  deleteNotificationUseCase: DeleteNotificationUseCase;
  fetchNotificationForStudentUseCase: FetchNotificationForStudentUseCase;
};

type CreateNotificationRequestBody = {
  title: string;
  description: string;
  target: 'all' | 'one';
  endDate: string;
  startDate: string;
  courseId?: string;
};

type UpdateNotificationRequestBody = {
  id: string;
  title?: string;
  description?: string;
  target?: 'all' | 'one';
  endDate?: string;
  startDate?: string;
  active?: boolean;
  courseId?: string;
};

export class NotificationController {
  constructor(private readonly useCases: NotificationControllerUseCases) {}

  createNotification = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    const notificationData = request.body as CreateNotificationRequestBody;
    const { user } = request;
    const userId = user.data.id;

    if (!user.isAdmin()) {
      return Forbidden();
    }

    if (notificationData.target === 'one' && !notificationData.courseId) {
      return BadRequest({
        message: 'Missing courseId',
        name: 'Missing courseId',
      });
    }

    if (notificationData.target === 'one' && notificationData.courseId) {
      const courseIdOrError = ID.parse(notificationData.courseId);

      if (courseIdOrError.isLeft()) {
        return BadRequest(courseIdOrError.value);
      }

      const resultOrError =
        await this.useCases.createNotificationUseCase.execute({
          title: notificationData.title,
          description: notificationData.description,
          target: notificationData.target,
          startDate: notificationData.startDate,
          endDate: notificationData.endDate,
          userId,
          courseId: courseIdOrError.value,
        });

      if (resultOrError.isLeft()) {
        return BadRequest(resultOrError.value);
      }

      return Created(resultOrError.value);
    }

    const resultOrError = await this.useCases.createNotificationUseCase.execute(
      {
        title: notificationData.title,
        description: notificationData.description,
        target: notificationData.target,
        startDate: notificationData.startDate,
        endDate: notificationData.endDate,
        userId,
      },
    );

    if (resultOrError.isLeft()) {
      return BadRequest(resultOrError.value);
    }

    return Created(resultOrError.value);
  };

  fetchNotification = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const { user } = request;

    if (!user.isAdmin()) {
      return Forbidden();
    }

    const userId = user.data.id;

    const resultOrError =
      await this.useCases.fetchNotificationUseCase.execute(userId);

    if (resultOrError.isLeft()) {
      return BadRequest(resultOrError.value);
    }

    const formattedNotifications = resultOrError.value.map((notification) => ({
      id: notification.data._id.value,
      title: notification.data.title,
      description: notification.data.description,
      courseId: notification.data.courseId?.value,
      target: notification.data.target,
      startDate: notification.data.startDate,
      endDate: notification.data.endDate,
      userId: notification.data.userId.value,
      active: notification.data.active,
    }));

    return reply.status(200).send({ notifications: formattedNotifications });
  };

  updateNotification = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const { user } = request;

    if (!user.isAdmin()) {
      return Forbidden();
    }

    const notificationInfo = request.body as UpdateNotificationRequestBody;

    const notificationIdOrError = ID.parse(notificationInfo.id);

    if (notificationIdOrError.isLeft()) {
      return BadRequest(notificationIdOrError.value);
    }

    const courseIdOrError = notificationInfo.courseId ? ID.parse(notificationInfo.courseId) : null

    if(courseIdOrError){
      if (courseIdOrError.isLeft()) {
        return BadRequest(courseIdOrError.value);
      }
    }
    const resultOrError = await this.useCases.updateNotificationUseCase.execute(
      {
        id: notificationIdOrError.value,
        title: notificationInfo.title,
        description: notificationInfo.description,
        target: notificationInfo.target,
        startDate: notificationInfo.startDate,
        endDate: notificationInfo.endDate,
        active: notificationInfo.active,
        courseId: courseIdOrError ? courseIdOrError.value : undefined,
      },
    );

    if (resultOrError.isLeft()) {
      return BadRequest(resultOrError.value);
    }

    return reply.status(204).send();
  };

  changeStatusNotification = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const { user } = request;

    if (!user.isAdmin()) {
      return Forbidden();
    }

    const notificationInfo = request.body as { id: string; active: boolean };

    const notificationIdOrError = ID.parse(notificationInfo.id);

    if (notificationIdOrError.isLeft()) {
      return BadRequest(notificationIdOrError.value);
    }

    const resultOrError =
      await this.useCases.changeStatusNotificationUseCase.execute({
        active: notificationInfo.active,
        id: notificationIdOrError.value,
      });

    if (resultOrError.isLeft()) {
      return BadRequest(resultOrError.value);
    }

    return reply.status(204).send();
  };

  deleteNotification = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    const { user } = request;

    if (!user.isAdmin()) {
      return Forbidden();
    }

    const { id } = request.params as { id: string };

    const notificationIdOrError = ID.parse(id);

    if (notificationIdOrError.isLeft()) {
      return BadRequest(notificationIdOrError.value);
    }

    const resultOrError = await this.useCases.deleteNotificationUseCase.execute(
      { id: notificationIdOrError.value },
    );

    if (resultOrError.isLeft()) {
      return BadRequest(resultOrError.value);
    }

    return OK(resultOrError.value);
  };

  fetchNotificationForStudent = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const { user } = request;

    const courseIds = user.data.courses.map((course) => course.id);

    const resultOrError =
      await this.useCases.fetchNotificationForStudentUseCase.execute({
        courseIds,
      });

    if (resultOrError.isLeft()) {
      return BadRequest(resultOrError.value);
    }

    const formattedNotifications = resultOrError.value.map((notification) => ({
      id: notification.data._id.value,
      title: notification.data.title,
      description: notification.data.description,
      courseId: notification.data.courseId?.value,
      target: notification.data.target,
      startDate: notification.data.startDate,
      endDate: notification.data.endDate,
      userId: notification.data.userId.value,
      active: notification.data.active,
    }));

    return reply.status(200).send({ notifications: formattedNotifications });
  };
}
