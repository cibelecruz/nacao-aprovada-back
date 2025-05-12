export class TaskNoteNotFoundError extends Error {
  constructor() {
    super('TaskNote not found');
  }
}
