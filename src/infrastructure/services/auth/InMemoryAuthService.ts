import { AuthService, CreateUserData } from "../../../application/auth/AuthService.js";
import { InvalidAuthTokenError } from "../../../errors/InvalidAuthTokenError.js";
import { Either, left, right } from "../../../shared/utils/Either.js";

export class InMemoryAuthService implements AuthService {
    constructor(private user: CreateUserData & { token?: string }) {};

    async createUser(data: CreateUserData): Promise<void> {
        this.user = data;
        await Promise.resolve();
    }
    async decodeToken(token: string): Promise<Either<InvalidAuthTokenError, string>> {
        if (token === this.user.token) {
            return await Promise.resolve(right(this.user.id.value));
        }
        return left(new InvalidAuthTokenError());
    }
    
}