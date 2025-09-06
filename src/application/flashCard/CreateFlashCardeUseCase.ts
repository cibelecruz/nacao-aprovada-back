import { FlashCard } from '../../domain/flashCard/FlashCard.js';
import type { FlashCardRepository } from '../../domain/flashCard/FlashCardRepository.js';
import type { ID } from '../../domain/Id.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface FlashCardDataProps {
  content: string;
  userId: ID;
  result?: boolean;
}

export class CreateFlashCardUseCase implements UseCase {
  constructor(private readonly flashCardRepository: FlashCardRepository) {}

  async execute(
    flashCardData: FlashCardDataProps,
  ): Promise<Either<Error, { id: ID }>> {
    const flashCardOrError = FlashCard.create({
      content: flashCardData.content,
      userId: flashCardData.userId,
      result: flashCardData.result,
    });

    if (flashCardOrError.isLeft()) {
      return left(new Error());
    }

    await this.flashCardRepository.create(flashCardOrError.value);
    return right({ id: flashCardOrError.value.data._id });
  }
}
