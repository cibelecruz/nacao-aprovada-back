import { HelpContent } from '../../domain/helpContent/HelpContent.js';
import type { HelpContentRepository } from '../../domain/helpContent/HelpContentRepository.js';
import type { ID } from '../../domain/Id.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface HelpContentData {
  content: string;
  title: string;
  videoUrl?: string;
  userId: ID;
}

export class CreateHelpContentUseCase implements UseCase {
  constructor(private readonly helpContentRepository: HelpContentRepository) {}

  async execute(
    helpContentInfo: HelpContentData,
  ): Promise<Either<Error, { id: ID }>> {
    const helpContentOrError = HelpContent.create({
      content: helpContentInfo.content,
      userId: helpContentInfo.userId,
      title: helpContentInfo.title,
      videoUrl: helpContentInfo.videoUrl ?? undefined,
    });

    if (helpContentOrError.isLeft()) {
      return left(new Error());
    }

    await this.helpContentRepository.create(helpContentOrError.value);

    return right({ id: helpContentOrError.value.data._id });
  }
}
