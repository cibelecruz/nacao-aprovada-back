export class InvalidHoursAvailableError extends Error {
  constructor(hours: number) {
    super(`The provided available hours is not valid: ${hours}`);
  }
}
