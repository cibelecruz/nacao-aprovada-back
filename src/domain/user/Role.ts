import { InvalidRoleError } from "../../errors/InvalidRoleError.js";
import { Either, right, left } from "../../shared/utils/Either.js";

export class Role {
    private readonly _value: string;

    private constructor(role: string) {
        this._value = role;
    }

    static create(this: void, role: string): Either<InvalidRoleError, Role> {
        if (!Role.validate(role)) {
            return left(new InvalidRoleError(role));
        }
        return right(new Role(role));
    }

    static validate(this: void, role: string): boolean {
        const allowedRoles = ['admin', 'mentor', 'superAdmin', 'student'];
        return allowedRoles.includes(role);
    }

    static createStudent(): Role {
        return new Role('student');
    }

    static createAdmin(): Role {
        return new Role('admin');
    }

    static createSuperAdmin(): Role {
        return new Role('superAdmin');
    }

    get value(): string {
        return this._value;
    }
}