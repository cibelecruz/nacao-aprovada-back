import { InvalidWeekdayError } from "../errors/InvalidWeekdayError.js";
import { Either, left, right } from "../shared/utils/Either.js";
import { CalendarDate } from "./CalendarDate.js";

type ValidWeekdays =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export class Weekday {
  private day: string;
  private static validDays = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];

  private constructor(day: ValidWeekdays) {
    this.day = day;
  }

  private static validate(day: string): day is ValidWeekdays {
    if (!Weekday.validDays.includes(day)) {
      return false;
    }
    return true;
  }

  static fromString(day: string): Either<InvalidWeekdayError, Weekday> {
    if (!this.validate(day)) {
        return left(new InvalidWeekdayError(day));
    }

    return right(Weekday.fromValidWeekday(day));
  }

  static fromCalendarDate(date: CalendarDate) {
    return Weekday.fromValidWeekday(Weekday.validDays[date.toDate().getDay()] as ValidWeekdays)
  }

  get value(): string {
    return this.day;
  }

  static MONDAY = new Weekday('monday');
  static TUESDAY = new Weekday('tuesday');
  static WEDNESDAY = new Weekday('wednesday');
  static THURSDAY = new Weekday('thursday');
  static FRIDAY = new Weekday('friday');
  static SATURDAY = new Weekday('saturday');
  static SUNDAY = new Weekday('sunday');

  private static fromValidWeekday(day: ValidWeekdays) {
    switch(day) {
      case 'monday': return Weekday.MONDAY;
      case 'tuesday': return Weekday.TUESDAY;
      case 'wednesday': return Weekday.WEDNESDAY;
      case 'thursday': return Weekday.THURSDAY;
      case 'friday': return Weekday.FRIDAY;
      case 'saturday': return Weekday.SATURDAY;
      case 'sunday': return Weekday.SUNDAY;
    }
  }

}
