import { InvalidDateCompletionTaskError } from '../../errors/InvalidDateCompletionTaskError.js';
import { Either, left, right } from '../../shared/utils/Either.js';

export class DateCompletionTask {
  private readonly _value: string;

  private constructor(dateCompletionTask: string) {
    this._value = dateCompletionTask;
  }

  static create(
    this: void,
    dateCompletionTask: string,
  ): Either<InvalidDateCompletionTaskError, Date> {
    if (!DateCompletionTask._validate(dateCompletionTask)) {
      return left(new InvalidDateCompletionTaskError(dateCompletionTask));
    }
    return right(new Date(dateCompletionTask));
  }

  static _validate(this: void, dateCompletionTask: string): boolean {
    const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

    if (!dateRegex.test(dateCompletionTask)) {
      return false;
    }

    const [_, month, day] = dateCompletionTask.split('-');
    const parsedMonth = parseInt(month, 10);
    const parsedDay = parseInt(day, 10);

    if (
      parsedMonth < 1 ||
      parsedMonth > 12 ||
      parsedDay < 1 ||
      parsedDay > 31
    ) {
      return false;
    }

    return true;
  }

  static default() {
    const today = new Date();
    return new Date(
      `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDay()).padStart(2, '0')}`,
    );
  }

  get value(): string {
    return this._value;
  }

  toString() {
    return this._value;
  }
}
