import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreateHelpContentUseCase } from '../../../../application/helpContent/CreateHelpContentUseCase.js';
import { Forbidden, type HttpResponse } from '../../utils/responseHelpers.js';
import type { UpdateHelpContentUseCase } from '../../../../application/helpContent/UpdateHelpContentUseCase.js';
import { ID } from '../../../../domain/Id.js';
import type { DeleteHelpContentUseCase } from '../../../../application/helpContent/DeleteHelpContentUseCase.js';
import type { FetchHelpContentUseCase } from '../../../../application/helpContent/FetchHelpContentUseCase.js';
import type { ToggleHelpContentAccessUseCase } from '../../../../application/helpContent/ToggleHelpContentAccessUseCase.js';
import type { FetchIAHelpContentUseCase } from '../../../../application/helpContent/FetchIAHelpContentUseCase.js';
import type { GetHelpContentUseCase } from '../../../../application/helpContent/GetHelpContentUseCase.js';

type HelpContentControllerUseCases = {
  createHelpContentUseCase: CreateHelpContentUseCase;
  updateHelpContentUseCase: UpdateHelpContentUseCase;
  deleteHelpContentUseCase: DeleteHelpContentUseCase;
  fetchHelpContentUseCase: FetchHelpContentUseCase;
  toggleHelpContentAccessUseCase: ToggleHelpContentAccessUseCase;
  fetchIAHelpContentUseCase: FetchIAHelpContentUseCase;
  getHelpContentUseCase: GetHelpContentUseCase;
};

type CreateHelpContentRequestBody = {
  content: string;
  title: string;
  videoUrl?: string;
};

type UpdateHelpContentRequestBody = {
  id: string;
  content?: string;
  title?: string;
  videoUrl?: string;
};

export class HelpContentController {
  constructor(private readonly useCases: HelpContentControllerUseCases) {}

  createHelpContent = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const user = request.user;

    if (!user.isAdmin()) {
      return Forbidden();
    }

    const userId = user.data.id;

    const { content, videoUrl, title } =
      request.body as CreateHelpContentRequestBody;

    const resultOrError = await this.useCases.createHelpContentUseCase.execute({
      content,
      videoUrl,
      userId,
      title,
    });

    if (resultOrError.isLeft()) {
      return reply.status(400).send(resultOrError.value);
    }

    return reply.status(201).send({ id: resultOrError.value.id.value });
  };

  updateHelpContent = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const user = request.user;

    if (!user.isAdmin()) {
      return Forbidden();
    }

    const { id, content, title, videoUrl } =
      request.body as UpdateHelpContentRequestBody;

    const contentIdOrError = ID.parse(id);

    if (contentIdOrError.isLeft()) {
      return reply.status(400).send(contentIdOrError.value);
    }

    const resultOrError = await this.useCases.updateHelpContentUseCase.execute({
      id: contentIdOrError.value,
      content,
      title,
      videoUrl,
    });

    if (resultOrError.isLeft()) {
      return reply.status(400).send(resultOrError.value);
    }

    return reply.status(200).send();
  };

  deleteHelpContent = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const user = request.user;

    if (!user.isAdmin()) {
      return Forbidden();
    }

    const { id } = request.params as { id: string };

    const contentIdOrError = ID.parse(id);

    if (contentIdOrError.isLeft()) {
      return reply.status(400).send(contentIdOrError.value);
    }

    const resultOrError = await this.useCases.deleteHelpContentUseCase.execute({
      id: contentIdOrError.value,
    });

    if (resultOrError.isLeft()) {
      return reply.status(400).send(resultOrError.value);
    }

    return reply.status(200).send();
  };

  fetchHelpContent = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const helpContents = await this.useCases.fetchHelpContentUseCase.execute();

    if (helpContents.isLeft()) {
      return reply.status(400).send(helpContents.value);
    }

    const formattedHelpContents = helpContents.value.map((helpContent) => ({
      id: helpContent.data._id.value,
      title: helpContent.data.title,
      content: helpContent.data.content,
      videoUrl: helpContent.data.videoUrl,
      createdAt: helpContent.data.createdAt,
      updatedAt: helpContent.data.updatedAt,
      userId: helpContent.data.userId.value,
      iaAccess: helpContent.data.iaAccess,
    }));

    return reply.status(200).send({ helpContent: formattedHelpContents });
  };

  toggleAcess = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const data = request.body as { id: string };

    const contentIdOrError = ID.parse(data.id);

    if (contentIdOrError.isLeft()) {
      return reply.status(400).send(contentIdOrError.value);
    }

    const resultOrError =
      await this.useCases.toggleHelpContentAccessUseCase.execute({
        id: contentIdOrError.value,
      });

    if (resultOrError.isLeft()) {
      return reply.status(400).send(resultOrError.value);
    }

    return reply.status(200).send({ message: 'Access toggled successfully' });
  };

  fetchIAContent = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const resultOrError =
      await this.useCases.fetchIAHelpContentUseCase.execute();

    if (resultOrError.isLeft()) {
      return reply.status(400).send(resultOrError.value);
    }

    const formattedHelpContents = resultOrError.value.map((helpContent) => ({
      id: helpContent.data._id.value,
      title: helpContent.data.title,
      content: helpContent.data.content,
      videoUrl: helpContent.data.videoUrl,
      createdAt: helpContent.data.createdAt,
      updatedAt: helpContent.data.updatedAt,
      userId: helpContent.data.userId.value,
      iaAccess: helpContent.data.iaAccess,
    }));

    return reply.status(200).send({ helpContent: formattedHelpContents });
  };

  getHelpContent = async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as { id: string };

    const contentIdOrError = ID.parse(id);

    if (contentIdOrError.isLeft()) {
      return reply.status(400).send(contentIdOrError.value);
    }

    const resultOrError = await this.useCases.getHelpContentUseCase.execute({
      id: contentIdOrError.value,
    });

    if (resultOrError.isLeft()) {
      return reply.status(400).send(resultOrError.value);
    }

    const helpContent = resultOrError.value;

    return reply.status(200).send({
      helpContent: {
        id: helpContent.data._id.value,
        title: helpContent.data.title,
        content: helpContent.data.content,
        videoUrl: helpContent.data.videoUrl,
        createdAt: helpContent.data.createdAt,
        updatedAt: helpContent.data.updatedAt,
        userId: helpContent.data.userId.value,
        iaAccess: helpContent.data.iaAccess,
      },
    });
  };
}
