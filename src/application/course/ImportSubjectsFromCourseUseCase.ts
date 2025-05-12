import { CourseRepository } from "../../domain/course/CourseRepository.js";
import { ID } from "../../domain/Id.js";
import { CourseNotFoundError } from "../../errors/CourseNotFoundError.js";
import { Either, left, right } from "../../shared/utils/Either.js";

export class ImportSubjectsUseCase {
    constructor(
        private readonly courseRepository: CourseRepository,
    ) {}
    
    async execute(courseFromId: ID, courseToId: ID): Promise<Either<Error, void>> {
        if (courseFromId.equals(courseToId)) {
            return left(new Error('Cannot import subjects from the same course'));
        }
        const courseFrom = await this.courseRepository.ofId(courseFromId);
        if (!courseFrom) {
            return left(new CourseNotFoundError());
        }
    
        const courseTo = await this.courseRepository.ofId(courseToId);
        if (!courseTo) {
            return left(new CourseNotFoundError());
        }

        courseTo.importSubjects(courseFrom);

        await this.courseRepository.save(courseTo);
    
        return right(undefined);
    }
}