import { InvalidCalendarDate } from '../errors/InvalidCalendarDate.js';
import { Either, left, right } from '../shared/utils/Either.js';
import { DateRange } from './DateRange.js';

export class CalendarDate {
  private readonly _value: string;
  private readonly _valueDate: Date;

  constructor(date: Date) {
    this._value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    this._valueDate = new Date(date);
  }

  static fromString(date: string): Either<InvalidCalendarDate, CalendarDate> {
    if (!CalendarDate._validate(date)) {
      return left(new InvalidCalendarDate(date));
    }
    return right(new CalendarDate(new Date(date)));
  }

  static _validate(date: string): boolean {
    const dateRegex =
      /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])(T\d{2}:\d{2}:\d{2}.\d{3})?$/;

    if (!dateRegex.test(date)) {
      return false;
    }

    return true;
  }

  static today() {
    return new CalendarDate(new Date());
  }

  static fromDate(date: Date) {
    return new CalendarDate(date);
  }

  addDays(days: number) {
    return CalendarDate.fromDate(
      new Date(this._valueDate.getTime() + days * 1000 * 24 * 3600),
    );
  }

  diffInDays(date: CalendarDate) {
    return Math.round(
      (new Date(date.value).getTime() - new Date(this._value).getTime()) /
        (1000 * 3600 * 24),
    );
  }

  toDate() {
    return new Date(this._valueDate);
  }

  isInRange(dateRange: DateRange) {
    return (
      (this.isAfter(dateRange.start) || this.isEqual(dateRange.start)) &&
      (this.isBefore(dateRange.end) || this.isEqual(dateRange.end))
    );
  }

  isBefore(date: CalendarDate) {
    return this._value < date._value;
  }

  isAfter(date: CalendarDate) {
    return this._value > date._value;
  }

  isEqual(date: CalendarDate) {
    return this._value === date._value;
  }

  get value(): string {
    return this._value;
  }

  toString() {
    return this._value;
  }
}
