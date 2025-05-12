import { Weekday } from '../Weekday.js';
import { TimespanInMinutes } from './TimespanInMinutes.js';

export class UserStudyAvailability {
  private readonly _value: Map<Weekday, TimespanInMinutes>;

  private constructor(weekAvailability: Map<Weekday, TimespanInMinutes>) {
    this._value = weekAvailability;
  }

  static create(
    weekAvailability: Map<Weekday, TimespanInMinutes>,
  ): UserStudyAvailability {
    return new UserStudyAvailability(weekAvailability);
  }

  static default() {
    return new UserStudyAvailability(
      new Map([
        [Weekday.MONDAY, TimespanInMinutes.default()],
        [Weekday.TUESDAY, TimespanInMinutes.default()],
        [Weekday.WEDNESDAY, TimespanInMinutes.default()],
        [Weekday.THURSDAY, TimespanInMinutes.default()],
        [Weekday.FRIDAY, TimespanInMinutes.default()],
        [Weekday.SATURDAY, TimespanInMinutes.empty()],
        [Weekday.SUNDAY, TimespanInMinutes.empty()],
      ]),
    );
  }

  toJSON() {
    return {
      [Weekday.MONDAY.value]: this._value.get(Weekday.MONDAY)?.minutes,
      [Weekday.TUESDAY.value]: this._value.get(Weekday.TUESDAY)?.minutes,
      [Weekday.WEDNESDAY.value]: this._value.get(Weekday.WEDNESDAY)?.minutes,
      [Weekday.THURSDAY.value]: this._value.get(Weekday.THURSDAY)?.minutes,
      [Weekday.FRIDAY.value]: this._value.get(Weekday.FRIDAY)?.minutes,
      [Weekday.SATURDAY.value]: this._value.get(Weekday.SATURDAY)?.minutes,
      [Weekday.SUNDAY.value]: this._value.get(Weekday.SUNDAY)?.minutes,
    }
  }

  setAvailability(day: Weekday, availability: TimespanInMinutes): void {
    this._value.set(day, availability);
  }

  getAvailability(day: Weekday): TimespanInMinutes {
    return this._value.get(day) || TimespanInMinutes.default();
  }

  get value() {
    return this._value;
  }

  toString() {
    return this._value;
  }
}
