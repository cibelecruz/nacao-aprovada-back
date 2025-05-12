import { InvalidPhoneError } from "../../errors/InvalidPhoneError.js";
import { Either, left, right } from "../../shared/utils/Either.js";

export class Phone {
    private readonly _value: string;

    private constructor(phone: string) {
        this._value = phone;
    }

    static create(this: void, phone: string): Either<InvalidPhoneError, Phone> {
        if (!Phone._validate(phone)) {
            return left(new InvalidPhoneError(phone));
        }
        return right(new Phone(phone));
    }

    static _validate(this: void, phone: string): boolean {
        const trimmedPhone = phone.trim();

        if (/[a-zA-Z]/.test(trimmedPhone)) {
            return false;
        }

        if (/[^0-9+() -]/.test(trimmedPhone)) {
            return false;
        }

        if (trimmedPhone.length < 9 || trimmedPhone.length > 22) {
            return false;
        }

        if (/\s{2,}/.test(trimmedPhone)) {
            return false;
        }

        const repeatedNumbersRegex = /(\d)\1{5,}/;
        if (repeatedNumbersRegex.test(trimmedPhone)) {
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
