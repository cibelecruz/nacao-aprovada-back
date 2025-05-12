export class InvalidCommentError extends Error {
  constructor(note: string) {
    super(`This note: ${note} is invalid`);
  }
}
