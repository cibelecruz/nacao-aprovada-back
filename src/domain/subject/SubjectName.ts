import { InvalidNameError } from '../../errors/InvalidNameError.js';
import { Either, left, right } from '../../shared/utils/Either.js';

export class SubjectName {
  private readonly _value: string;

  private constructor(name: string) {
    this._value = name;
  }

  static create(
    this: void,
    name: string,
  ): Either<InvalidNameError, SubjectName> {
    if (!SubjectName._validate(name)) {
      return left(new InvalidNameError(name));
    }
    return right(new SubjectName(name));
  }

  isEqualTo(aNewName: SubjectName) {
    return this._value === aNewName.value;
  }

  static _validate(this: void, name: string): boolean {
    if (!name.trim() || name.length < 3 || name.length > 400) {
      return false;
    }
    //Necessário pois já existem dados no banco que não permitem essa regra existir, mas necessário futuramente
    // const specialCharRegex = /[^a-zA-ZÀ-ú0-9\s'º:/.-]/;
    // if (specialCharRegex.test(name)) {
    //   return false;
    // }

    if (name !== name.trimEnd()) {
      return false;
    }

    return true;
  }

  get value(): string {
    return this._value;
  }

  toString() {
    return this._value;
  }
}
