export class InvalidElapsedTimeInSeconds extends Error {
  constructor(time: number) {
    super(`The provided time '${time}' is invalid.`);
  }
}
