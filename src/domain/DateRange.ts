import { InvalidDateRange } from '../errors/InvalidDateRange.js';
import { Either, left, right } from '../shared/utils/Either.js';
import { CalendarDate } from './CalendarDate.js';

export class DateRange {
  private _start: CalendarDate;
  private _end: CalendarDate;

  private constructor(start: CalendarDate, end: CalendarDate) {
    this._start = start;
    this._end = end;
  }

  static create({
    start,
    end,
  }: {
    start: CalendarDate;
    end: CalendarDate;
  }): Either<InvalidDateRange, DateRange> {
    if (start > end) {
      return left(new InvalidDateRange([start.value, end.value]));
    }

    return right(new DateRange(start, end));
  }

  get start() {
    return this._start;
  }

  get end() {
    return this._end;
  }

  diffInDays() {
    return Math.round(new Date(this._end.value).getTime() - new Date(this._start.value).getTime())/(1000 * 3600 * 24)
  }

  contains(date: CalendarDate) {
    return (
      (date.isAfter(this.start) || date.isEqual(this.start)) &&
      (date.isBefore(this.end) || date.isEqual(this.end))
    );
  }
}
