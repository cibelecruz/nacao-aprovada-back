import { Either, left, right } from '../../shared/utils/Either.js';
import { InvalidCpfError } from '../../errors/InvalidCpfError.js';

export class Cpf {
  private readonly _value: string;

  private constructor(cpf: string) {
    this._value = cpf;
  }

  static create(cpf: string): Either<InvalidCpfError, Cpf> {
    if (cpf === undefined || Cpf._validate(cpf)) {
      return right(new Cpf(cpf));
    }
    return left(new InvalidCpfError(cpf));
  }

  static _validate(value: unknown) {
    if (typeof value !== 'string') {
      return false;
    }
    if (!/^[0-9]{11}$/.test(value)) {
      return false;
    }
    if (new RegExp(`^${value.at(0)}{11}$`).test(value)) {
      return false;
    }

    const verifyingDigits = Array.from(value.substring(9)).map((digit) =>
      parseInt(digit),
    );
    const validation = {
      sum: 0,
      remainder: 0,
    };
    for (let i = 0; i < 9; i++) {
      validation.sum += (10 - i) * parseInt(value.at(i) as string);
    }
    validation.remainder = ((validation.sum * 10) % 11) % 10;
    if (validation.remainder !== verifyingDigits[0]) {
      return false;
    }

    validation.sum = 0;
    for (let i = 0; i < 10; i++) {
      validation.sum += (11 - i) * parseInt(value.at(i) as string);
    }
    validation.remainder = ((validation.sum * 10) % 11) % 10;
    if (validation.remainder !== verifyingDigits[1]) {
      return false;
    }
    return true;
  }

  get value() {
    return this._value;
  }

  toString() {
    return this._value;
  }
}
