export class InvalidNameError extends Error {
  constructor(name: string) {
    super(`The provided name '${name}' is invalid.`);
  }
}
