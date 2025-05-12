export class InvalidIdError extends Error {
  constructor(id: string) {
    super(`The provided id '${id}' is invalid.`);
  }
}
