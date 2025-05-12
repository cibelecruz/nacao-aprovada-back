import type { ID } from '../../domain/Id.js';
import type { SimulationRepository } from '../../domain/simulation/SimulationRepository.js';
import { Simulation } from '../../domain/simulation/Simulation.js';
import type { UseCase } from '../../shared/UseCase.js';
import { right, type Either } from '../../shared/utils/Either.js';

type SimulationData = {
  userId: ID;
  name: string;
  subjects: {
    name: string;
    totalQuestions: number;
    correctQuestions: number;
  }[];
  date: string;
};
export class CreateSimulationUseCase implements UseCase {
  constructor(private readonly simulationRepository: SimulationRepository) {}
  async execute(
    simulationData: SimulationData,
  ): Promise<Either<Error, Simulation>> {
    const simulationOrError = Simulation.create({
      userId: simulationData.userId,
      date: simulationData.date,
      name: simulationData.name,
      subjects: simulationData.subjects.map((subject) => ({
        name: subject.name,
        totalQuestions: Number(subject.totalQuestions),
        correctQuestions: Number(subject.correctQuestions),
      })),
    });

    if (simulationOrError.isLeft()) {
      return simulationOrError;
    }

    await this.simulationRepository.create(simulationOrError.value);

    return right(simulationOrError.value);
  }
}
