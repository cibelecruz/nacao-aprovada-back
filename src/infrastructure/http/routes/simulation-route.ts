import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { SimulationController } from '../controllers/simulation/SimulationController.js';
import { CreateSimulationUseCase } from '../../../application/simulation/CreateSimulationUseCase.js';
import { MongooseSimulationRepository } from '../../database/mongoose/MongooseSimulationRepository.js';
import { firebaseAuthMiddleware } from '../middlewares/firebaseAuthMiddleware.js';
import { FetchSimulationByUserId } from '../../../application/simulation/FetchSimulationByUserId.js';
import { GetSimulationById } from '../../../application/simulation/GetSimulationByIdUseCase.js';
import { UpdateSimulationDataUseCase } from '../../../application/simulation/UpdateSimulationDataUseCase.js';
import { DeleteSimulationtUseCase } from '../../../application/simulation/DeleteSimulationUseCase.js';

const simulationController = new SimulationController({
  createSimulationUseCase: new CreateSimulationUseCase(
    new MongooseSimulationRepository(),
  ),
  fetchSimulationByUserIdUseCase: new FetchSimulationByUserId(
    new MongooseSimulationRepository(),
  ),
  getSimulationById: new GetSimulationById(new MongooseSimulationRepository()),
  updateSimulationDataUseCase: new UpdateSimulationDataUseCase(
    new MongooseSimulationRepository(),
  ),
  deleteSimulationUseCase: new DeleteSimulationtUseCase(
    new MongooseSimulationRepository(),
  ),
});

export default function SimulationRoute(
  server: FastifyInstance,
  opts: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) {
  server.addHook('preHandler', firebaseAuthMiddleware);
  server.post('/', simulationController.createSimulation);

  server.put('/update', simulationController.updateSimulationData);

  server.get('/', simulationController.fetchSimulationsByUserId);
  server.get('/:id', simulationController.getSimulationById);
  server.get('/performance', simulationController.getPerformance);

  server.delete('/:id', simulationController.deleteSimulation);

  done();
}
