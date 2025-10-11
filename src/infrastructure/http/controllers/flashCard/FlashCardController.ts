import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreateFlashCardUseCase } from '../../../../application/flashCard/CreateFlashCardeUseCase.js';
import type { FindAllFlashCardUseCase } from '../../../../application/flashCard/FindAllFlashCardUseCase.js';
import type { UpdateFlashcardUseCase } from '../../../../application/flashCard/UpdateFlashcardUseCase.js';
import type { DeleteFlashCardUseCase } from '../../../../application/flashCard/DeleteFlashCardUseCase.js';
import type { FindFlashCardByIdUseCase } from '../../../../application/flashCard/FindFlashCardByIdUseCase.js';
import { ID } from '../../../../domain/Id.js';
import type { UUID } from 'crypto';

type FlashCardControllerUseCases = {
  createFlashCardUseCase: CreateFlashCardUseCase;
  findAllFlashCardUseCase: FindAllFlashCardUseCase;
  updateFlashCardUseCase: UpdateFlashcardUseCase;
  deleteFlashCardUseCase: DeleteFlashCardUseCase;
  findFlashCardByIdUseCase: FindFlashCardByIdUseCase;
};

type CreateFlashCardRequestBody = {
  title: string;
  content: string;
  result?: boolean;
};

type UpdateFlashCardRequestBody = {
  id: string;
  title?: string;
  content?: string;
  result?: boolean;
};

export class FlashCardController {  
  constructor(private readonly useCases: FlashCardControllerUseCases) {}

  createFlashCard = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    const userId = user.data.id;

    const { content, title } = request.body as CreateFlashCardRequestBody;

    const resultOrError = await this.useCases.createFlashCardUseCase.execute({
      content,
      userId,
      title,
    }); 

    if (resultOrError.isLeft()) {
      return reply.status(400).send(resultOrError.value);
    }

    return reply.status(201).send({ id: resultOrError.value.id });
  };

  findAllByUserId = async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    const userId = user.data.id;

    const resultOrError = await this.useCases.findAllFlashCardUseCase.execute({
      userId,
    });

    if (resultOrError.isLeft()) {
      return reply.status(400).send({ message: resultOrError.value });
    }

    return reply.status(200).send({ flashCard: resultOrError.value });
  };

  updateFlashCard = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id, content, title, result } = request.body as UpdateFlashCardRequestBody;
    const flashCardId = ID.create(id as UUID);

    const resultOrError = await this.useCases.updateFlashCardUseCase.execute({
      id: flashCardId,
      content,
      title,
      result,
    });

    if (resultOrError.isLeft()) {
      return reply.status(400).send({ message: resultOrError.value });
    }

    return reply.status(200).send({ flashCard: resultOrError.value });
  };

  deleteFlashCard = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const flashCardId = ID.create(id as UUID);

    const resultOrError = await this.useCases.deleteFlashCardUseCase.execute({
      id: flashCardId,
    });

    if (resultOrError.isLeft()) {
      return reply.status(400).send({ message: resultOrError.value });
    }

    return reply.status(200).send({ success: resultOrError.value.success });
  };

  findFlashCardById = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };
    const flashCardId = ID.create(id as UUID);

    const resultOrError = await this.useCases.findFlashCardByIdUseCase.execute({
      id: flashCardId,
    });

    if (resultOrError.isLeft()) {
      return reply.status(404).send({ message: resultOrError.value });
    }

    return reply.status(200).send({ flashCard: resultOrError.value.flashCard });
  };
}
