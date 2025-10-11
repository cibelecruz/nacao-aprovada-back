import { FlashCard } from '../../../domain/flashCard/FlashCard.js';
import type { FlashCardRepository } from '../../../domain/flashCard/FlashCardRepository.js';
import { ID } from '../../../domain/Id.js';
import { FlashCardModel } from './models/FlashCardModel.js';

export class MongooseFlashCardRepository implements FlashCardRepository {
  async fetchAllIsNotReady(userId: ID): Promise<FlashCard[]> {
    const flashCardsData = await FlashCardModel.find({
      userId: userId.value,
      isReady: true,
    })
      .lean()
      .exec();

    return flashCardsData.map((flashCardData) => {
      const flashCardResult = FlashCard.create({
        content: flashCardData.content,
        result: flashCardData.result
          ? Boolean(flashCardData.result)
          : undefined,
        userId: ID.create(flashCardData.userId),
        title: flashCardData.title
      });

      if (flashCardResult.isLeft()) {
        throw new Error('Failed to create FlashCard');
      }

      return flashCardResult.value;
    });
  }
  async create(flashCard: FlashCard): Promise<void> {
    await new FlashCardModel({
      _id: flashCard.data._id,
      content: flashCard.data.content,
      title: flashCard.data.title,
      result: flashCard.data.result,
      userId: flashCard.data.userId,
    }).save();
  }
  async ofId(id: ID): Promise<FlashCard | null> {
    const flashCardData = await FlashCardModel.findOne({
      _id: id.value,
    })
      .lean()
      .exec();

    if (!flashCardData) {
      return null;
    }

    const flashCardResult = FlashCard.create({
      content: flashCardData.content,
      title: flashCardData.title,
      result: flashCardData.result ? Boolean(flashCardData.result) : undefined,
      userId: ID.create(flashCardData.userId),
    });

    if (flashCardResult.isLeft()) {
      throw new Error('Failed to create FlashCard');
    }

    return flashCardResult.value;
  }
  async save(flashCard: FlashCard): Promise<void> {
    await FlashCardModel.updateOne(
      {
        _id: flashCard.data._id,
      },
      {
        content: flashCard.data.content,
        title: flashCard.data.title,
        result: flashCard.data.result,
        isReady: flashCard.data.isReady,
      },
    );
  }
  async delete(id: ID): Promise<void> {
    await FlashCardModel.deleteOne({
      _id: id.value,
    }).exec();
  }

  async fetchAll(userId: ID): Promise<FlashCard[]> {
    const flashCardsData = await FlashCardModel.find({
      userId: userId.value,
    })
      .lean()
      .exec();

    return flashCardsData.map((flashCardData) => {
      const flashCardResult = FlashCard.create({
        content: flashCardData.content,
        title: flashCardData.title,
        result: flashCardData.result
          ? Boolean(flashCardData.result)
          : undefined,
        userId: ID.create(flashCardData.userId),
      });

      if (flashCardResult.isLeft()) {
        throw new Error('Failed to create FlashCard');
      }

      return flashCardResult.value;
    });
  }
}
