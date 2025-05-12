export class UnauthorizedTaskManipulation extends Error {
    constructor() {
        super("Only the task owner can manipulate the task");
    }
}
