export class MissingRequiredParamsError extends Error {
  constructor() {
    super('Missing required parameters.');
    this.name = 'MissingRequiredParamsError';
  }
}
