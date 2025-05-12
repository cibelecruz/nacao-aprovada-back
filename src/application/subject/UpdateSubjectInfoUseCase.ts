import { ID } from "../../domain/Id.js";
import { SubjectName } from "../../domain/subject/SubjectName.js";
import { SubjectRepository } from "../../domain/subject/SubjectRepository.js";
import { SubjectNotFoundError } from "../../errors/SubjectNotFoundError.js";
import { UseCase } from "../../shared/UseCase.js";
import { Either, left, right } from "../../shared/utils/Either.js";

type UpdateSubjectInfoPayload = 
    {subjectId: ID, name: SubjectName};

export class UpdateSubjectInfoUseCase implements UseCase {
    constructor(private readonly subjectRepository: SubjectRepository) {}
    async execute(data: UpdateSubjectInfoPayload): Promise<Either<SubjectNotFoundError, undefined>> {
        const subject = await this.subjectRepository.ofId(data.subjectId);
        if (!subject) {
            return left(new SubjectNotFoundError());
        }

        subject.updateName(data.name);

        await this.subjectRepository.save(subject);
        return right(undefined);
    }
}