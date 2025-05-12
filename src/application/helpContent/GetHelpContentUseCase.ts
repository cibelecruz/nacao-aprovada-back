import { HelpContent } from '../../domain/helpContent/HelpContent.js';
import type { HelpContentRepository } from '../../domain/helpContent/HelpContentRepository.js';
import type { ID } from '../../domain/Id.js';
import { HelpContentNotFoundError } from '../../errors/HelpContentNotFoundError.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface GetHelpContentUseCaseData {
  id: ID;
}

export class GetHelpContentUseCase implements UseCase {
  constructor(private readonly helpContentRepository: HelpContentRepository) {}

  async execute({
    id,
  }: GetHelpContentUseCaseData): Promise<
    Either<HelpContentNotFoundError, HelpContent>
  > {
    const helpContent = await this.helpContentRepository.ofId(id);

    if (!helpContent) {
      return left(new HelpContentNotFoundError());
    }

    return right(helpContent);
  }
}
