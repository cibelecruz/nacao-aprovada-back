import type { HelpContent } from '../../domain/helpContent/HelpContent.js';
import type { HelpContentRepository } from '../../domain/helpContent/HelpContentRepository.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

export class FetchIAHelpContentUseCase implements UseCase {
  constructor(private readonly helpContentRepository: HelpContentRepository) {}

  async execute(): Promise<Either<Error, HelpContent[]>> {
    try {
      const helpContents = await this.helpContentRepository.fetchAll();

      const helpContentIA = helpContents.filter(
        (helpContent) => helpContent.data.iaAccess === true,
      );

      return right(helpContentIA);
    } catch (error) {
      return left(new Error('Error fetching help content'));
    }
  }
}
