export class SimulationNotFoundError extends Error {
  constructor() {
    super(`Simulation not found.`);
  }
}
