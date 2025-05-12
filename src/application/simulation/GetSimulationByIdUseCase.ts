import type { ID } from '../../domain/Id.js';
import type { Simulation } from '../../domain/simulation/Simulation.js';
import type { SimulationRepository } from '../../domain/simulation/SimulationRepository.js';
import { SimulationNotFoundError } from '../../errors/SimulationNotFoundError.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

export class GetSimulationById implements UseCase {
  constructor(private readonly simualtionRepository: SimulationRepository) {}
  async execute(id: ID): Promise<Either<SimulationNotFoundError, Simulation>> {
    const simulation = await this.simualtionRepository.ofId(id);

    if (!simulation) {
      return left(new SimulationNotFoundError());
    }

    return right(simulation);
  }
}
