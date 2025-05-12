import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { CreateNotificationUseCase } from '../../../application/notification/CreateNotificationUseCase.js';
import { MongooseNotificationRepository } from '../../database/mongoose/MongooseNotificationRepository.js';
import { NotificationController } from '../controllers/notification/NotificationController.js';
import { firebaseAuthMiddleware } from '../middlewares/firebaseAuthMiddleware.js';
import { FetchNotificationUseCase } from '../../../application/notification/FetchNotificationUseCase.js';
import { UpdateNotificationUseCase } from '../../../application/notification/UpdateNotificationUseCase.js';
import { ChangeStatusNotificationUseCase } from '../../../application/notification/ChangeStatusNotificationUseCase.js';
import { DeleteNotificationUseCase } from '../../../application/notification/DeleteNotificationUseCase.js';
import { FetchNotificationForStudentUseCase } from '../../../application/notification/FetchNotificationForStudentUseCase.js';

const notificationController = new NotificationController({
  createNotificationUseCase: new CreateNotificationUseCase(
    new MongooseNotificationRepository(),
  ),
  fetchNotificationUseCase: new FetchNotificationUseCase(
    new MongooseNotificationRepository(),
  ),
  updateNotificationUseCase: new UpdateNotificationUseCase(
    new MongooseNotificationRepository(),
  ),
  changeStatusNotificationUseCase: new ChangeStatusNotificationUseCase(
    new MongooseNotificationRepository(),
  ),
  deleteNotificationUseCase: new DeleteNotificationUseCase(
    new MongooseNotificationRepository(),
  ),
  fetchNotificationForStudentUseCase: new FetchNotificationForStudentUseCase(
    new MongooseNotificationRepository(),
  ),
});

export default function (
  server: FastifyInstance,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  opts: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) {
  server.addHook('preHandler', firebaseAuthMiddleware);

  server.post('/', notificationController.createNotification);
  server.get('/list', notificationController.fetchNotification);
  server.patch('/', notificationController.updateNotification);
  server.put('/change-status', notificationController.changeStatusNotification);
  server.delete('/:id', notificationController.deleteNotification);
  server.get('/student', notificationController.fetchNotificationForStudent);

  done();
}
