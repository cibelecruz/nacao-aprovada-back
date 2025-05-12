import { HelpContent } from '../../domain/helpContent/HelpContent.js';
import type { HelpContentRepository } from '../../domain/helpContent/HelpContentRepository.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

export class FetchHelpContentUseCase implements UseCase {
  constructor(private readonly helpContentRepository: HelpContentRepository) {}

  async execute(): Promise<Either<Error, HelpContent[]>> {
    try {
      const helpContent = await this.helpContentRepository.fetchAll();

      return right(helpContent);
    } catch (error) {
      return left(new Error('Error fetching help content'));
    }
  }
}
