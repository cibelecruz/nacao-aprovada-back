export class InsufficientPrivilegesError extends Error {
  constructor() {
    super(`The user does not have sufficient privileges to perform this action.`);
  }
}