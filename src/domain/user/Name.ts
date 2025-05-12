import { InvalidNameError } from "../../errors/InvalidNameError.js";
import { Either, left, right } from "../../shared/utils/Either.js";


export class Name {
    private readonly _value: string;

    private constructor(name: string) {
        this._value = name;
    }

    static create(this: void, name: string): Either<InvalidNameError, Name> {
        if (!Name._validate(name)) {
            return left(new InvalidNameError(name));
        }
        return right(new Name(name))
    }

    static _validate(this: void, name: string): boolean {
        if (!name.trim() || name.length < 6 || name.length > 49) {
            return false;
        }

        const specialCharRegex = /[!@#$%^&*(),.?":{}|<>0-9]/;
        if (specialCharRegex.test(name)) {
            return false;
        }

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