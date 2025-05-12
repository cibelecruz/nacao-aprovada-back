import { FastifyRequest } from 'fastify';
import { AddSubjectUseCase } from '../../../../application/subject/AddSubjectUseCase.js';
import { TaskType } from '../../../../domain/task/Task.js';
import {
  BadRequest,
  Created,
  Forbidden,
  HttpResponse,
  InternalServerError,
  NotFound,
  OK,
  Updated,
} from '../../utils/responseHelpers.js';
import { SubjectQuery } from '../../../database/mongoose/SubjectQuery.js';
import { MissingRequiredParamsError } from '../../../../errors/MissingRequiredParamsError.js';
import { ID } from '../../../../domain/Id.js';
import { InvalidNameError } from '../../../../errors/InvalidNameError.js';
import { Either, left, right } from '../../../../shared/utils/Either.js';
import { TaskType as TaskTypeClass } from '../../../../domain/task/TaskType.js';
import { RegisterSubjectCustomizationsUseCase } from '../../../../application/subject/RegisterSubjectCustomizationsUseCase.js';
import { Topic } from '../../../../domain/subject/Topic.js';
import { SubjectName } from '../../../../domain/subject/SubjectName.js';
import { UpdateSubjectInfoUseCase } from '../../../../application/subject/UpdateSubjectInfoUseCase.js';
import { DeleteSubjectUseCase } from '../../../../application/subject/DeleteSubjectUseCase.js';
import { SubjectNotFoundError } from '../../../../errors/SubjectNotFoundError.js';

type AddSubjectRequestBody = {
  name?: string;
  topics?: {
    name?: string;
    taskTypes?: TaskType[];
  }[];
};

type RegisterSubjectCustomizationsRequestBody = {
  subjectId?: string;
  topics?: {
    id?: string;
    name?: string;
    active?: boolean;
    taskTypes?: string[];
  }[];
};

type UpdateSubjectInfoPayload = {
  name?: string;
};

type SubjectControllerUseCases = {
  addSubject: AddSubjectUseCase;
  registerSubjectCustomizationUseCase: RegisterSubjectCustomizationsUseCase;
  updateSubjectInfoUseCase: UpdateSubjectInfoUseCase;
  deleteSubjectUseCase: DeleteSubjectUseCase;
};

function parseTopicsFromUpdateTaskTypesRequestBody(
  topics: Required<RegisterSubjectCustomizationsRequestBody>['topics'],
): Either<Error, Topic[]> {
  const validTopics: Topic[] = [];

  for (const topic of topics) {
    if (!topics || !topics.length || !topic.id) {
      return left(new MissingRequiredParamsError());
    }

    if (
      !topic.taskTypes ||
      topic.active === undefined ||
      !topic.id ||
      !topic.name
    ) {
      return left(new MissingRequiredParamsError());
    }

    const topicIdOrError = ID.parse(topic.id);
    if (topicIdOrError.isLeft()) {
      return left(topicIdOrError.value);
    }

    const topicNameOrError = SubjectName.create(topic.name);
    if (topicNameOrError.isLeft()) {
      return left(topicNameOrError.value);
    }

    if (topic.taskTypes.length !== 0) {
      const taskTypes: TaskTypeClass[] = [];
      for (const taskType of topic.taskTypes) {
        const taskTypeOrError = TaskTypeClass.create(taskType);
        if (taskTypeOrError.isLeft()) {
          return left(taskTypeOrError.value);
        }
        taskTypes.push(taskTypeOrError.value);
      }
      validTopics.push(
        Topic.create({
          id: topicIdOrError.value,
          active: topic.active,
          name: topicNameOrError.value,
          taskTypes,
        }),
      );
    } else {
      validTopics.push(
        Topic.create({
          id: topicIdOrError.value,
          name: topicNameOrError.value,
          active: topic.active,
          taskTypes: [],
        }),
      );
    }
  }

  return right(validTopics);
}

export class SubjectController {
  constructor(private readonly useCases: SubjectControllerUseCases) {}

  addSubject = async (request: FastifyRequest) => {
    try {
      const payload = request.body as AddSubjectRequestBody | undefined;

      if (!payload || !payload.name || !payload.topics) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const { name, topics } = payload;

      topics.forEach((topic) => {
        if (!topic.name || !topic.taskTypes) {
          return BadRequest(new MissingRequiredParamsError());
        }
      });

      const parsedTopics = topics.map((topic) => ({
        name: topic.name || '',
        taskTypes: topic.taskTypes || [],
      }));

      const resultOrError = await this.useCases.addSubject.execute(
        name,
        parsedTopics,
      );

      if (
        resultOrError.isLeft() &&
        resultOrError.value instanceof InvalidNameError
      ) {
        return BadRequest(resultOrError.value);
      }

      if (resultOrError.isLeft()) {
        return InternalServerError();
      }

      const subjectId = resultOrError.value;
      return Created({ id: subjectId });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  getOne = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      if (!user.isAdmin()) {
        return Forbidden();
      }
      const params = request.params as { id: string };
      if (!params || !params.id) {
        return new MissingRequiredParamsError() as unknown as HttpResponse;
      }
      const id = params.id;

      const idOrError = ID.parse(id);

      if (idOrError.isLeft()) {
        return BadRequest(idOrError.value);
      }

      const subjectQuery = new SubjectQuery();
      const subjects = await subjectQuery.find(idOrError.value);
      return OK(subjects);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  getAll = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      if (!user.isAdmin()) {
        return Forbidden();
      }

      const subjectQuery = new SubjectQuery();
      const subjects = await subjectQuery.list();
      return OK(subjects);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  setTopics = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const requestUser = request.user;
      const payload = request.body as
        | RegisterSubjectCustomizationsRequestBody
        | undefined;

      if (!requestUser.isAdmin()) {
        return Forbidden();
      }

      if (!payload || !payload.subjectId || !payload.topics) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const subjectId = ID.parse(payload.subjectId);
      if (subjectId.isLeft()) {
        return BadRequest(subjectId.value);
      }

      const parseResultOrError = parseTopicsFromUpdateTaskTypesRequestBody(
        payload.topics,
      );

      if (parseResultOrError.isLeft()) {
        return BadRequest(parseResultOrError.value);
      }

      const topics = parseResultOrError.value;

      const registerSubjectCustomizationResultOrError =
        await this.useCases.registerSubjectCustomizationUseCase.execute(
          subjectId.value,
          topics,
        );
      if (registerSubjectCustomizationResultOrError.isLeft()) {
        return InternalServerError(
          registerSubjectCustomizationResultOrError.value,
        );
      }

      return OK({
        isSuccess: true,
        isError: false,
        message: 'Subject topics updated successfully',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError(new Error('Uncaught exception'));
    }
  };

  update = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      if (!user.isAdmin()) {
        return Forbidden();
      }

      const params = request.params as { id?: string } | undefined;
      if (!params || !params.id) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const id = params.id;
      const idOrError = ID.parse(id);
      if (idOrError.isLeft()) {
        return BadRequest(idOrError.value);
      }

      const payload = request.body as UpdateSubjectInfoPayload | undefined;

      if (!payload || !payload.name) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const { name } = payload;

      const subjectNameOrError = SubjectName.create(name);
      if (subjectNameOrError.isLeft()) {
        return BadRequest(subjectNameOrError.value);
      }

      const resultOrError =
        await this.useCases.updateSubjectInfoUseCase.execute({
          subjectId: idOrError.value,
          name: subjectNameOrError.value,
        });

      if (resultOrError.isLeft()) {
        return InternalServerError(resultOrError.value);
      }

      return Updated({
        isSuccess: true,
        isError: false,
        message: 'Subject updated successfully',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  delete = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      if (!user.isAdmin()) {
        return Forbidden();
      }

      const params = request.params as { id?: string } | undefined;
      if (!params || !params.id) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const id = params.id;
      const idOrError = ID.parse(id);
      if (idOrError.isLeft()) {
        return BadRequest(idOrError.value);
      }

      const deleteSubjectUseCaseOrError = await this.useCases.deleteSubjectUseCase.execute(
        idOrError.value,
      );

      if (deleteSubjectUseCaseOrError.isLeft()) {
        if (deleteSubjectUseCaseOrError.value instanceof SubjectNotFoundError) {
          return NotFound(deleteSubjectUseCaseOrError.value);
        }
        return InternalServerError(deleteSubjectUseCaseOrError.value);
      }
      
      return OK({
        isSuccess: true,
        isError: false,
        message: 'Subject deleted successfully',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  }
}
