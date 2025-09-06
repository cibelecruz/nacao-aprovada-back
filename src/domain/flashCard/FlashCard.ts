import { right, type Either } from '../../shared/utils/Either.js';
import { ID } from '../Id.js';

type FlashCardProps = {
  _id: ID;
  content: string;
  isReady: boolean;
  result?: boolean;
  userId: ID;
  readyAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

interface FlashCardDataProps
  extends Omit<FlashCardProps, '_id' | 'createdAt' | 'updatedAt' | 'isReady'> {
  isReady?: boolean;
}

export class FlashCard {
  private constructor(private _data: FlashCardProps) {}

  updateContent(content: string): void {
    this._data.content = content;
  }

  updateResult(result: boolean) {
    this._data.result = result;
  }

  updateIsReady(isReady: boolean) {
    this._data.isReady = isReady;
    this._data.readyAt = new Date();
  }

  get data() {
    return this._data;
  }

  static create(data: FlashCardDataProps): Either<never, FlashCard> {
    return right(
      new FlashCard({
        _id: ID.create(),
        content: data.content,
        isReady: data.isReady ?? false,
        readyAt: data.readyAt,
        result: data.result,
        userId: data.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    );
  }
}
