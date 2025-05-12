import { InvalidEmailError } from "../../errors/InvalidEmailError.js";
import { Either, left, right } from "../../shared/utils/Either.js";

export class Email {
    private readonly _value: string;

    private constructor(email: string) {
        this._value = email;
    }

    static create(this: void, email: string): Either<InvalidEmailError, Email> {
        const trimmedEmail = email.trim();
        if (!Email.validate(trimmedEmail)) {
            return left(new InvalidEmailError(email));
        }
        return right(new Email(trimmedEmail));
    }

    static validate(this: void, email: string): boolean {
        if (email.length > 256) {
            return false;
        }
        const [localPart, domain] = email.split('@');
        if (!localPart || !domain) {
            return false;
        }
        if (localPart.length > 64 || domain.length > 254) {
            return false;
        }
        const regexValidator =
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{3}\.[0-9]{3}\.[0-9]{3}\.[0-9]{3}])|([a-zA-Z0-9]+([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
        return regexValidator.test(email);
    }

    get value(): string {
        return this._value;
    }

    toString() {
        return this._value;
    }
}