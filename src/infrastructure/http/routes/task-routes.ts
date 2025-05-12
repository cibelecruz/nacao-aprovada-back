import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { CompleteTaskUseCase } from '../../../application/task/CompleteTaskUseCase.js';
import { ComputeTaskElapsedTimeUseCase } from '../../../application/task/ComputeTaskElapsedTimeUseCase.js';
import { GetTasksTimelineUseCase } from '../../../application/task/GetTasksTimelineUseCase.js';
import { MongooseTaskRepository } from '../../database/mongoose/MongooseTaskRepository.js';
import { TaskController } from '../controllers/task/TaskController.js';
import routeAdapter from './route-adapter.js';
import { firebaseAuthMiddleware } from '../middlewares/firebaseAuthMiddleware.js';
import { EventDispatcher } from '../../../shared/EventDispatcher.js';
import { CreateExtraTaskUseCase } from '../../../application/task/CreateExtraTaskUseCase.js';
import { UncompleteTaskUseCase } from '../../../application/task/UncompleteTaskUseCase.js';
import { StudentRemoveTaskUseCase } from '../../../application/task/StudentRemoveTaskUseCase.js';

const eventDispatcher = EventDispatcher.getInstance();

const taskController = new TaskController({
  completeTaskUseCase: new CompleteTaskUseCase(
    new MongooseTaskRepository(eventDispatcher),
  ),
  elapsedTimeUseCase: new ComputeTaskElapsedTimeUseCase(
    new MongooseTaskRepository(eventDispatcher),
  ),
  getTasksTimelineUseCase: new GetTasksTimelineUseCase(),
  createExtraTaskUseCase: new CreateExtraTaskUseCase(
    new MongooseTaskRepository(eventDispatcher),
  ),
  uncompleteTaskUseCase: new UncompleteTaskUseCase(
    new MongooseTaskRepository(eventDispatcher),
  ),
  studanteRemoveTaskUseCase: new StudentRemoveTaskUseCase(
    new MongooseTaskRepository(eventDispatcher),
  ),
});

export default function (
  server: FastifyInstance,
  opts: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) {
  server.addHook('preHandler', firebaseAuthMiddleware);
  server.get('/', routeAdapter(taskController.getScheduledTask));
  server.post(
    '/compute-elapsed-time',
    routeAdapter(taskController.updateElapsedTime),
  );
  server.post('/complete-task', routeAdapter(taskController.complete));
  server.put('/uncomplete-task', routeAdapter(taskController.uncomplete));

  server.post(
    '/create-extra-task',
    routeAdapter(taskController.createExtraTask),
  );
  server.get(
    '/order-overview/:userId',
    routeAdapter(taskController.getTaskOrderOverview),
  );
  server.delete('/remove-task', routeAdapter(taskController.studantRemoveTask));

  done();
}
