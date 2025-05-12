import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { HelpContentController } from '../controllers/helpContent/HelpContentController.js';
import { CreateHelpContentUseCase } from '../../../application/helpContent/CreateHelpContentUseCase.js';
import { MongooseHelpContentRepository } from '../../database/mongoose/MongooseHelpContentRepository.js';
import { DeleteHelpContentUseCase } from '../../../application/helpContent/DeleteHelpContentUseCase.js';
import { FetchHelpContentUseCase } from '../../../application/helpContent/FetchHelpContentUseCase.js';
import { UpdateHelpContentUseCase } from '../../../application/helpContent/UpdateHelpContentUseCase.js';
import { firebaseAuthMiddleware } from '../middlewares/firebaseAuthMiddleware.js';
import { ToggleHelpContentAccessUseCase } from '../../../application/helpContent/ToggleHelpContentAccessUseCase.js';
import { FetchIAHelpContentUseCase } from '../../../application/helpContent/FetchIAHelpContentUseCase.js';
import { GetHelpContentUseCase } from '../../../application/helpContent/GetHelpContentUseCase.js';

const helpContentController = new HelpContentController({
  createHelpContentUseCase: new CreateHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  deleteHelpContentUseCase: new DeleteHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  fetchHelpContentUseCase: new FetchHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  updateHelpContentUseCase: new UpdateHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  toggleHelpContentAccessUseCase: new ToggleHelpContentAccessUseCase(
    new MongooseHelpContentRepository(),
  ),
  fetchIAHelpContentUseCase: new FetchIAHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  getHelpContentUseCase: new GetHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
});

export default function (
  server: FastifyInstance,
  opts: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) {
  server.addHook('preHandler', firebaseAuthMiddleware);

  server.get('/', helpContentController.fetchHelpContent);
  server.post('/', helpContentController.createHelpContent);
  server.put('/', helpContentController.updateHelpContent);
  server.delete('/:id', helpContentController.deleteHelpContent);
  server.patch('/toggle-access', helpContentController.toggleAcess);
  server.get('/:id', helpContentController.getHelpContent);

  done();
}
