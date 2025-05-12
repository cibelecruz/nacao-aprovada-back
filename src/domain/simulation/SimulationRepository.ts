import type { ID } from '../Id.js';
import type { Simulation } from './Simulation.js';

export interface SimulationRepository {
  create(simulation: Simulation): Promise<void>;
  ofId(id: ID): Promise<Simulation | null>;
  save(simulation: Simulation): Promise<void>;
  delete(id: ID): Promise<void>;
  findByUserId(userId: ID): Promise<Simulation[]>;
}
