import type { ID } from '../../domain/Id.js';
import type { Simulation } from '../../domain/simulation/Simulation.js';
import type { SimulationRepository } from '../../domain/simulation/SimulationRepository.js';
import type { UseCase } from '../../shared/UseCase.js';
import { right, type Either } from '../../shared/utils/Either.js';

export class FetchSimulationByUserId implements UseCase {
  constructor(private readonly simulationRepository: SimulationRepository) {}
  async execute(userId: ID): Promise<Either<never, Simulation[]>> {
    const simulations = await this.simulationRepository.findByUserId(userId);

    return right(simulations);
  }
}
