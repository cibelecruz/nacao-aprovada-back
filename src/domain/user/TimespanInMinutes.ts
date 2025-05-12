import { InvalidHoursAvailableError } from '../../errors/InvalidHoursAvailableError.js';
import { InvalidMinutesAvailableError } from '../../errors/InvalidMinutesAvailableError.js';
import { Either, left, right } from '../../shared/utils/Either.js';

export class TimespanInMinutes {
  private _minutes: number;

  private constructor(minutes: number) {
    this._minutes = minutes;
  }

  private static validate(minutes: number): boolean {
    if (!Number.isInteger(minutes) || minutes < 0 || minutes > 24 * 60) {
      return false;
    }
    return true;
  }

  get minutes(): number {
    return this._minutes;
  }

  static fromHours(
    hours: number,
  ): Either<InvalidHoursAvailableError, TimespanInMinutes> {
    const minutes = hours * 60;
    if (hours < 0 || hours > 24) {
      return left(new InvalidHoursAvailableError(hours));
    }
    return right(new TimespanInMinutes(minutes));
  }

  static create(
    minutes: number,
  ): Either<InvalidMinutesAvailableError, TimespanInMinutes> {
    if (!this.validate(minutes)) {
      return left(new InvalidMinutesAvailableError(minutes));
    }

    return right(new TimespanInMinutes(minutes));
  }

  static default(): TimespanInMinutes {
    return new TimespanInMinutes(2 * 60);
  }

  static empty(): TimespanInMinutes {
    return new TimespanInMinutes(0);
  }

  static max(): TimespanInMinutes {
    return new TimespanInMinutes(24 * 60);
  }

  subtract(value: TimespanInMinutes) {
    if (this._minutes - value._minutes <= 0) {
      return TimespanInMinutes.empty();
    }
    return new TimespanInMinutes(this._minutes - value._minutes);
  }

  add(value: TimespanInMinutes) {
    if (this._minutes + value._minutes > 24 * 60) {
      return TimespanInMinutes.max();
    }
    return new TimespanInMinutes(this._minutes + value._minutes);
  }
}
