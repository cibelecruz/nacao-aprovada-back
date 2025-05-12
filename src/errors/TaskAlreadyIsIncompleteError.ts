export class TaskAlreadyIsIncompleteError extends Error {
  constructor() {
    super('Task already is incomplete');
  }
}
