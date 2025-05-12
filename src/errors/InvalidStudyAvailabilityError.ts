export class InvalidStudyAvailabilityError extends Error {
    constructor(studyAvailability: number[]) {
        const studyAvailabilityArray: string = studyAvailability.join(',')
        super(`The provided timeline ' ${studyAvailabilityArray}' is invalid.`);
    }
}
