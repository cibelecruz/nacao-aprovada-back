import type { FlashCardRepository } from '../../domain/flashCard/FlashCardRepository.js';
import type { ID } from '../../domain/Id.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface DeleteFlashCardDataProps {
  id: ID;
}

export class DeleteFlashCardUseCase implements UseCase {
  constructor(private readonly flashCardRepository: FlashCardRepository) {}

  async execute(
    deleteData: DeleteFlashCardDataProps,
  ): Promise<Either<Error, { success: boolean }>> {
    try {
      // Verifica se o FlashCard existe antes de deletar
      const existingFlashCard = await this.flashCardRepository.ofId(
        deleteData.id,
      );

      if (!existingFlashCard) {
        return left(new Error('FlashCard not found'));
      }

      // Deleta o FlashCard
      await this.flashCardRepository.delete(deleteData.id);

      return right({ success: true });
    } catch (error) {
      return left(new Error('Failed to delete FlashCard'));
    }
  }
}
