export class InvalidDateCompletionTaskError extends Error {
  constructor(date: string) {
    super(`The date '${date}' is invalid.`);
  }
}
