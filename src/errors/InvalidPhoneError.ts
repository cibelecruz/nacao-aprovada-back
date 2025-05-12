export class InvalidPhoneError extends Error {
    constructor(phone: string) {
        super(`The provided phone '${phone}' is invalid.`);
    }

}
