export class HelpContentNotFoundError extends Error {
  constructor() {
    super(`Help content not found.`);
  }
}
