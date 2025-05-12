import type { HelpContentRepository } from '../../domain/helpContent/HelpContentRepository.js';
import type { ID } from '../../domain/Id.js';
import { HelpContentNotFoundError } from '../../errors/HelpContentNotFoundError.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

type DeleteNotificationData = {
  id: ID;
};

export class DeleteHelpContentUseCase implements UseCase {
  constructor(private readonly helpContentRepository: HelpContentRepository) {}

  async execute({
    id,
  }: DeleteNotificationData): Promise<
    Either<HelpContentNotFoundError, undefined>
  > {
    const helpContent = await this.helpContentRepository.ofId(id);

    if (!helpContent) {
      return left(new HelpContentNotFoundError());
    }

    await this.helpContentRepository.delete(id);

    return right(undefined);
  }
}
