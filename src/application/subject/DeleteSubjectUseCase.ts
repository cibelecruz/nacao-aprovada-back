import { ID } from "../../domain/Id.js";
import { SubjectRepository } from "../../domain/subject/SubjectRepository.js";
import { SubjectNotFoundError } from "../../errors/SubjectNotFoundError.js";
import { UseCase } from "../../shared/UseCase.js";
import { Either, left, right } from "../../shared/utils/Either.js";

export class DeleteSubjectUseCase implements UseCase {
    constructor(private readonly subjectRepository: SubjectRepository) {}
    
    async execute(id: ID): Promise<Either<SubjectNotFoundError, undefined>> {
        const subject = await this.subjectRepository.ofId(id);

        if (!subject) {
            return left(new SubjectNotFoundError())
        }

        subject.delete();

        await this.subjectRepository.save(subject);

        return right(undefined);
    }
}