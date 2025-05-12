import type { HelpContentRepository } from '../../domain/helpContent/HelpContentRepository.js';
import type { ID } from '../../domain/Id.js';
import { HelpContentNotFoundError } from '../../errors/HelpContentNotFoundError.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface HelpContentData {
  id: ID;
  content?: string;
  title?: string;
  videoUrl?: string;
}

export class UpdateHelpContentUseCase implements UseCase {
  constructor(private readonly helpContentRepository: HelpContentRepository) {}

  async execute(
    helpContentInfo: HelpContentData,
  ): Promise<Either<HelpContentNotFoundError, undefined>> {
    const helpContent = await this.helpContentRepository.ofId(
      helpContentInfo.id,
    );

    if (!helpContent) {
      return left(new HelpContentNotFoundError());
    }

    if (helpContentInfo.content) {
      helpContent.updateContent(helpContentInfo.content);
    }

    if (helpContentInfo.title) {
      helpContent.updateTitle(helpContentInfo.title);
    }

    helpContent.updateVideoUrl(helpContentInfo.videoUrl ?? '');

    await this.helpContentRepository.save(helpContent);

    return right(undefined);
  }
}
