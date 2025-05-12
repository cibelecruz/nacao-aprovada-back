export class InvalidRoleError extends Error {
  constructor(role: string) {
    super(`The provided role '${role}' is invalid.`);
  }
}
