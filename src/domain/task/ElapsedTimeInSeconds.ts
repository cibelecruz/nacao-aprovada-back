import { InvalidElapsedTimeInSeconds } from '../../errors/InvalidElapsedTimeInSeconds.js';
import { Either, left, right } from '../../shared/utils/Either.js';

export class ElapsedTimeInSeconds {
  private readonly _value: number;

  private constructor(elapsedTimeInSeconds: number) {
    this._value = elapsedTimeInSeconds;
  }

  static create(
    elapsedTimeInSeconds: number,
  ): Either<InvalidElapsedTimeInSeconds, ElapsedTimeInSeconds> {
    if (!ElapsedTimeInSeconds._validate(elapsedTimeInSeconds)) {
      return left(new InvalidElapsedTimeInSeconds(elapsedTimeInSeconds));
    }
    return right(new ElapsedTimeInSeconds(elapsedTimeInSeconds));
  }

  static _validate(this: void, elapsedTimeInSeconds: number): boolean {
    if (!Number.isInteger(elapsedTimeInSeconds)) {
      return false;
    }

    if (elapsedTimeInSeconds <= 0) {
      return false;
    }

    return true;
  }

  get value(): number {
    return this._value;
  }

  toString() {
    return this._value;
  }
}
