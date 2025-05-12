export class InvalidCalendarDate extends Error {
    constructor(date: string) {
      super(
        `The format of the provided date '${date}' is invalid.`,
      );
    }
  }
  