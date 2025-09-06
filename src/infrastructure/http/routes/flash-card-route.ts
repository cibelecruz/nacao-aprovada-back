import { CreateFlashCardUseCase } from '../../../application/flashCard/CreateFlashCardeUseCase.js';
import { FindAllFlashCardUseCase } from '../../../application/flashCard/FindAllFlashCardUseCase.js';
import { UpdateFlashcardUseCase } from '../../../application/flashCard/UpdateFlashcardUseCase.js';
import { DeleteFlashCardUseCase } from '../../../application/flashCard/DeleteFlashCardUseCase.js';
import { FindFlashCardByIdUseCase } from '../../../application/flashCard/FindFlashCardByIdUseCase.js';
import { MongooseFlashCardRepository } from '../../database/mongoose/MongooseFlashCardRepository.js';
import { FlashCardController } from '../controllers/flashCard/FlashCardController.js';
import type { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { firebaseAuthMiddleware } from '../middlewares/firebaseAuthMiddleware.js';

const flashCardRepository = new MongooseFlashCardRepository();

const flashCardController = new FlashCardController({
  createFlashCardUseCase: new CreateFlashCardUseCase(flashCardRepository),
  findAllFlashCardUseCase: new FindAllFlashCardUseCase(flashCardRepository),
  updateFlashCardUseCase: new UpdateFlashcardUseCase(flashCardRepository),
  deleteFlashCardUseCase: new DeleteFlashCardUseCase(flashCardRepository),
  findFlashCardByIdUseCase: new FindFlashCardByIdUseCase(flashCardRepository),
});

export default function (
  server: FastifyInstance,
  opts: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) {
  server.addHook('preHandler', firebaseAuthMiddleware);

  server.post('/', flashCardController.createFlashCard);
  server.get('/', flashCardController.findAllByUserId);
  server.patch('/', flashCardController.updateFlashCard);
  server.delete('/:id', flashCardController.deleteFlashCard);
  server.get('/:id', flashCardController.findFlashCardById);
}
