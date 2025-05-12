import { UUID, randomUUID } from 'node:crypto';
import { Either, left, right } from '../shared/utils/Either.js';
import { InvalidIdError } from '../errors/InvalidIdError.js';

export class ID {
  private readonly _value: UUID;

  private constructor(id?: UUID) {
    this._value = id ?? randomUUID();
  }

  equals(id: ID) {
    return this._value === id.value;
  }

  static parse(id: string): Either<InvalidIdError, ID> {
    if (id === undefined || ID._validate(id)) {
      return right(new ID(id));
    }
    return left(new InvalidIdError(id));
  }

  static create(id?: UUID) {
    return new ID(id);
  }

  static isValid(id: string): id is UUID {
    return ID._validate(id);
  }

  static _validate(id: string): id is UUID {
    const validatorRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    return validatorRegex.test(id);
  }

  get value() {
    return this._value;
  }

  toString() {
    return this._value;
  }
}
