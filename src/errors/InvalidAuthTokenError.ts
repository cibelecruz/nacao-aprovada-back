export class InvalidAuthTokenError extends Error {
  constructor() {
    super('The provided id token is invalid or expired');
  }
}
