export class UserAlreadyEnrolledInCourse extends Error {
  constructor() {
    super(`User is already enrolled in course`);
  }
}
