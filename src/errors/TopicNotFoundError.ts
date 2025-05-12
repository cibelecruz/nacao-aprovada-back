export class TopicNotFoundError extends Error {
  constructor() {
    super(`Topic not found.`);
  }
}
