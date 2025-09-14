import { FlashCard } from '../../domain/flashCard/FlashCard.js';
import type { FlashCardRepository } from '../../domain/flashCard/FlashCardRepository.js';
import type { ID } from '../../domain/Id.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface FindAllFlashCardUseCaseProps {
  userId: ID;
}

export class FindAllFlashCardUseCase implements UseCase {
  constructor(private readonly flashCardRepository: FlashCardRepository) {}

  async execute({
    userId,
  }: FindAllFlashCardUseCaseProps): Promise<Either<Error, FlashCard[]>> {
    try {
      const allFlashCards = await this.flashCardRepository.fetchAll(userId);

      // Filtra os FlashCards: isReady = false OU (isReady = true E readyAt >= 1 semana)
      const oneWeekAgo = new Date();
      const DAYS = 15;
      oneWeekAgo.setDate(oneWeekAgo.getDate() - DAYS);

      const filteredFlashCards = allFlashCards.filter((flashCard) => {
        // Se isReady é false, sempre inclui
        if (!flashCard.data.isReady) {
          return true;
        }

        // Se isReady é true, verifica se readyAt é maior ou igual a uma semana
        if (flashCard.data.isReady && flashCard.data.readyAt) {
          return flashCard.data.readyAt >= oneWeekAgo;
        }

        // Se isReady é true mas readyAt é undefined, não inclui
        return false;
      });

      return right(filteredFlashCards);
    } catch (error) {
      return left(new Error('Error fetching flash cards'));
    }
  }
}
