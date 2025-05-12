import type { ID } from '../../domain/Id.js';
import type { Simulation } from '../../domain/simulation/Simulation.js';
import type { SimulationRepository } from '../../domain/simulation/SimulationRepository.js';
import { SimulationNotFoundError } from '../../errors/SimulationNotFoundError.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface SimulationUpdateDataProps {
  data: {
    id: ID;
    name?: string;
    subjects?: {
      id?: ID;
      name: string;
      totalQuestions: number;
      correctQuestions: number;
    }[];
    date?: string;
  };
}

export class UpdateSimulationDataUseCase implements UseCase {
  constructor(private readonly simulationRepository: SimulationRepository) {}

  async execute({
    data,
  }: SimulationUpdateDataProps): Promise<
    Either<SimulationNotFoundError, Simulation>
  > {
    const simulation = await this.simulationRepository.ofId(data.id);
    if (!simulation) {
      return left(new SimulationNotFoundError());
    }

    if (data.name) {
      simulation.updateName(data.name);
    }

    if (data.date) {
      simulation.updateDate(data.date);
    }

    if (data.subjects) {
      simulation.removeAllSubjects();

      for (const subjectData of data.subjects) {
        simulation.addSubject({
          id: subjectData.id,
          name: subjectData.name,
          totalQuestions: subjectData.totalQuestions,
          correctQuestions: subjectData.correctQuestions,
        });
      }
    }

    await this.simulationRepository.save(simulation);

    return right(simulation);
  }
}
