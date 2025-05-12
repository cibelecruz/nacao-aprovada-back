export class DeleteSubjectInCourseError extends Error {
  constructor(message: string | undefined) {
    super(message);
    this.name = 'DeleteSubjectInCourseError';
  }
}
