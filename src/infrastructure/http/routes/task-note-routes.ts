import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import routeAdapter from './route-adapter.js';
import { firebaseAuthMiddleware } from '../middlewares/firebaseAuthMiddleware.js';
import { TaskNoteController } from '../controllers/taskNote/TaskNoteController.js';
import { CreateOrUpdateTaskNoteUseCase } from '../../../application/taskNote/CreateOrUpdateTaskNoteUseCase.js';
import { MongooseTaskRepository } from '../../database/mongoose/MongooseTaskRepository.js';
import { EventDispatcher } from '../../../shared/EventDispatcher.js';

const eventDispatcher = EventDispatcher.getInstance();
const taskNoteController = new TaskNoteController({
  createOrupdateTaskNoteUseCase: new CreateOrUpdateTaskNoteUseCase(
    new MongooseTaskRepository(eventDispatcher),
  ),
});

export default function (
  server: FastifyInstance,
  opts: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) {
  server.addHook('preHandler', firebaseAuthMiddleware);
  server.post(
    '/register-note',
    routeAdapter(taskNoteController.createTaskNote),
  );

  done();
}
