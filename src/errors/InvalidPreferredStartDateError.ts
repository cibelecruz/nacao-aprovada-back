import { CalendarDate } from '../domain/CalendarDate.js';

export class InvalidPreferredStartDateError extends Error {
  constructor(date: CalendarDate) {
    super(`The provided date '${String(date)}' is invalid.`);
  }
}
