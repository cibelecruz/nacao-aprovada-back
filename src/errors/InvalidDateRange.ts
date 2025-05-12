export class InvalidDateRange extends Error {
  constructor(range: [string, string]) {
    super(
      `The dates provided are invalid. start: ${range[0]}, end: ${range[1]}`,
    );
  }
}
