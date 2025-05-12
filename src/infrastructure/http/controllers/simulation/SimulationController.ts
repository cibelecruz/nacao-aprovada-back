import type { FastifyReply, FastifyRequest } from 'fastify';
import type { CreateSimulationUseCase } from '../../../../application/simulation/CreateSimulationUseCase.js';
import { BadRequest, type HttpResponse } from '../../utils/responseHelpers.js';
import { MissingRequiredParamsError } from '../../../../errors/MissingRequiredParamsError.js';
import type { FetchSimulationByUserId } from '../../../../application/simulation/FetchSimulationByUserId.js';
import type { GetSimulationById } from '../../../../application/simulation/GetSimulationByIdUseCase.js';
import { ID } from '../../../../domain/Id.js';
import type { UpdateSimulationDataUseCase } from '../../../../application/simulation/UpdateSimulationDataUseCase.js';
import type { DeleteSimulationtUseCase } from '../../../../application/simulation/DeleteSimulationUseCase.js';

interface SimulationControllerUseCases {
  createSimulationUseCase: CreateSimulationUseCase;
  fetchSimulationByUserIdUseCase: FetchSimulationByUserId;
  getSimulationById: GetSimulationById;
  updateSimulationDataUseCase: UpdateSimulationDataUseCase;
  deleteSimulationUseCase: DeleteSimulationtUseCase;
}

interface CreateSimulationRequestBody {
  name: string;
  subjects: {
    name: string;
    totalQuestions: number;
    correctQuestions: number;
  }[];
  date: string;
}

interface UpdateSimulationDataRequestBody {
  id: string;
  data: {
    name?: string;
    subjects?: {
      id: ID;
      name?: string;
      totalQuestions?: number;
      correctQuestions?: number;
    }[];
    date?: string;
  };
}

export class SimulationController {
  constructor(private readonly useCases: SimulationControllerUseCases) {}

  createSimulation = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const userId = request.user.data.id;

    const payload = request.body as CreateSimulationRequestBody;

    if (!payload || !payload.name || !payload.subjects || !payload.date) {
      return BadRequest(new MissingRequiredParamsError());
    }

    const simulationData = {
      userId,
      ...payload,
    };
    const resultOrError =
      await this.useCases.createSimulationUseCase.execute(simulationData);

    if (resultOrError.isLeft()) {
      return BadRequest(resultOrError.value);
    }

    return reply.status(201).send({ simulation: resultOrError.value });
  };

  fetchSimulationsByUserId = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const userId = request.user.data.id;

    const resultOrError =
      await this.useCases.fetchSimulationByUserIdUseCase.execute(userId);

    if (resultOrError.isLeft()) {
      return BadRequest(resultOrError.value);
    }

    const simulations = resultOrError.value.map((simulation) => ({
      id: simulation.data.id.value,
      userId: simulation.data.userId.value,
      name: simulation.data.name,
      date: simulation.data.date,
      subjects: simulation.data.subjects.map((subject) => ({
        id: subject.id.value,
        name: subject.name,
        totalQuestions: subject.totalQuestions,
        correctQuestions: subject.correctQuestions,
      })),
    }));

    return reply.status(200).send({ simulations });
  };

  getSimulationById = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const { id } = request.params as { id: string };

    const simulationIdOrError = ID.parse(id);

    if (simulationIdOrError.isLeft()) {
      return BadRequest(simulationIdOrError.value);
    }

    const resultOrError = await this.useCases.getSimulationById.execute(
      simulationIdOrError.value,
    );

    if (resultOrError.isLeft()) {
      return BadRequest(resultOrError.value);
    }

    const simulation = {
      id: resultOrError.value.data.id.value,
      userId: resultOrError.value.data.userId.value,
      name: resultOrError.value.data.name,
      date: resultOrError.value.data.date,
      subjects: resultOrError.value.data.subjects.map((subject) => ({
        id: subject.id.value,
        name: subject.name,
        totalQuestions: Number(subject.totalQuestions),
        correctQuestions: Number(subject.correctQuestions),
      })),
    };

    return reply.status(200).send({ simulation });
  };

  updateSimulationData = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const payload = request.body as UpdateSimulationDataRequestBody;
    if (!payload) {
      return BadRequest(new MissingRequiredParamsError());
    }

    const simulationIdOrError = ID.parse(payload.id);

    if (simulationIdOrError.isLeft()) {
      return BadRequest(simulationIdOrError.value);
    }

    const data = {
      ...payload,
      id: simulationIdOrError.value,
    };

    const resultOrError =
      await this.useCases.updateSimulationDataUseCase.execute({
        data,
      });

    if (resultOrError.isLeft()) {
      return BadRequest(resultOrError.value);
    }

    const simulation = {
      name: resultOrError.value.data.name,
      id: resultOrError.value.data.id.value,
      subjects: resultOrError.value.data.subjects.map((subject) => ({
        id: subject.id.value,
        name: subject.name,
        totalQuestions: Number(subject.totalQuestions),
        correctQuestions: Number(subject.correctQuestions),
      })),
    };
    return reply.status(200).send({ simulation });
  };

  deleteSimulation = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const { id } = request.params as { id: string };

    const simulationIdOrError = ID.parse(id);

    if (simulationIdOrError.isLeft()) {
      return BadRequest(simulationIdOrError.value);
    }

    const resultOrError = await this.useCases.deleteSimulationUseCase.execute(
      simulationIdOrError.value,
    );

    if (resultOrError.isLeft()) {
      return BadRequest(resultOrError.value);
    }

    return reply.status(200).send();
  };

  getPerformance = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const userId = request.user.data.id;

    const resultOrError =
      await this.useCases.fetchSimulationByUserIdUseCase.execute(userId);

    if (resultOrError.isLeft()) {
      return BadRequest(resultOrError.value);
    }

    const performanceByDate: Record<
      string,
      {
        totalQuestions: number;
        correctQuestions: number;
        incorrectQuestions: number;
      }
    > = {};

    resultOrError.value.forEach((simulation) => {
      const totalQuestions = simulation.data.subjects.reduce(
        (acc, subject) => acc + Number(subject.totalQuestions),
        0,
      );
      const correctQuestions = simulation.data.subjects.reduce(
        (acc, subject) => acc + Number(subject.correctQuestions),
        0,
      );
      const date = simulation.data.date;

      if (!performanceByDate[date]) {
        performanceByDate[date] = {
          totalQuestions: 0,
          correctQuestions: 0,
          incorrectQuestions: 0,
        };
      }
      performanceByDate[date].totalQuestions += totalQuestions;
      performanceByDate[date].correctQuestions += correctQuestions;
      performanceByDate[date].incorrectQuestions +=
        totalQuestions - correctQuestions;
    });

    const today = new Date();
    const past30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      return {
        date: dateString,
        totalQuestions: performanceByDate[dateString]?.totalQuestions || 0,
        correctQuestions: performanceByDate[dateString]?.correctQuestions || 0,
        incorrectQuestions:
          performanceByDate[dateString]?.incorrectQuestions || 0,
      };
    }).reverse();

    past30Days;

    return reply.status(200).send({ simulationPerformance: past30Days });
  };
}
