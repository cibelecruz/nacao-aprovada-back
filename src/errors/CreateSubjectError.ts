export class CreateSubjectError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'CreateSubjectError';
    }
  }