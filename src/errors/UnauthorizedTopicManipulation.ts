export class UnauthorizedTopicManipulation extends Error {
  constructor() {
    super('Only the topic owner can manipulate the topic');
  }
}
