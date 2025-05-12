export class UserNotEnrolledError extends Error {
  constructor() {
    super(`User is not enrolled in this course`);
    this.name = 'UserNotEnrolledError';
  }
}
