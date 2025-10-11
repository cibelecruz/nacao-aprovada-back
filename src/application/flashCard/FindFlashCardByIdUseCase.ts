import { FlashCard } from '../../domain/flashCard/FlashCard.js';
import type { FlashCardRepository } from '../../domain/flashCard/FlashCardRepository.js';
import type { ID } from '../../domain/Id.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface FindFlashCardByIdDataProps {
  id: ID;
}

export class FindFlashCardByIdUseCase implements UseCase {
  constructor(private readonly flashCardRepository: FlashCardRepository) {}

  async execute(
    findData: FindFlashCardByIdDataProps,
  ): Promise<Either<Error, { flashCard: FlashCard }>> {
    try {
      const flashCard = await this.flashCardRepository.ofId(findData.id);

      if (!flashCard) {
        return left(new Error('FlashCard not found'));
      }

      return right({ flashCard });
    } catch (error) {
      return left(new Error('Failed to find FlashCard'));
    }
  }
}
