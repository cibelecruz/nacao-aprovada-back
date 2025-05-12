export class InvalidTaskTypeError extends Error {
  constructor(value: string) {
    super(`Invalid task type: ${value}`);
  }
}