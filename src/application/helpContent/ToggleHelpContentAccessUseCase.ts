import type { HelpContentRepository } from '../../domain/helpContent/HelpContentRepository.js';
import type { ID } from '../../domain/Id.js';
import { HelpContentNotFoundError } from '../../errors/HelpContentNotFoundError.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface ToggleHelpContentAccessData {
  id: ID;
}

export class ToggleHelpContentAccessUseCase implements UseCase {
  constructor(private readonly helpContentRepository: HelpContentRepository) {}

  async execute({
    id,
  }: ToggleHelpContentAccessData): Promise<
    Either<HelpContentNotFoundError, undefined>
  > {
    const helpContent = await this.helpContentRepository.ofId(id);

    if (!helpContent) {
      return left(new HelpContentNotFoundError());
    }

    helpContent.toggleAccess(!helpContent.data.iaAccess);

    await this.helpContentRepository.save(helpContent);

    return right(undefined);
  }
}
