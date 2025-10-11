import { FlashCard } from '../../domain/flashCard/FlashCard.js';
import type { FlashCardRepository } from '../../domain/flashCard/FlashCardRepository.js';
import type { ID } from '../../domain/Id.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface UpdateFlashCardDataProps {
  id: ID;
  content?: string;
  title?: string;
  result?: boolean;
}

export class UpdateFlashcardUseCase implements UseCase {
  constructor(private readonly flashCardRepository: FlashCardRepository) {}

  async execute(
    updateData: UpdateFlashCardDataProps,
  ): Promise<Either<Error, { success: boolean }>> {
    try {
      // Busca o FlashCard existente
      const existingFlashCard = await this.flashCardRepository.ofId(
        updateData.id,
      );

      if (!existingFlashCard) {
        return left(new Error('FlashCard not found'));
      }

      // Atualiza os campos fornecidos
      if (updateData.content !== undefined) {
        existingFlashCard.updateContent(updateData.content);
      }

      if (updateData.title !== undefined) {
        existingFlashCard.updateTitle(updateData.title);
      }

      if (updateData.result !== undefined) {
        existingFlashCard.updateResult(updateData.result);
      }

      // Salva as alterações
      await this.flashCardRepository.save(existingFlashCard);

      return right({ success: true });
    } catch (error) {
      return left(new Error('Failed to update FlashCard'));
    }
  }
}
