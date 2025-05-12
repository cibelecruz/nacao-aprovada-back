export class InvalidMinutesAvailableError extends Error {
  constructor(minutes: number) {
    super(`The provided available minutes is not valid: ${minutes}`);
  }
}
