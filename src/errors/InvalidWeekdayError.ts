export class InvalidWeekdayError extends Error {
  constructor(day: string) {
    super(`The value: ${day} provided is invalid`);
  }
}
