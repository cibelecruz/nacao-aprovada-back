import type { ID } from '../../domain/Id.js';
import type { SimulationRepository } from '../../domain/simulation/SimulationRepository.js';
import { SimulationNotFoundError } from '../../errors/SimulationNotFoundError.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

export class DeleteSimulationtUseCase implements UseCase {
  constructor(private readonly simulationRepository: SimulationRepository) {}

  async execute(id: ID): Promise<Either<SimulationNotFoundError, undefined>> {
    const simulation = await this.simulationRepository.ofId(id);

    if (!simulation) {
      return left(new SimulationNotFoundError());
    }

    await this.simulationRepository.delete(id);

    return right(undefined);
  }
}
