import { Either, left, right } from '../../shared/utils/Either.js';
import { InvalidQuestionResultError } from '../../errors/InvalidQuestionResultError.js';

export class QuestionResultNote {
  private readonly _questionResult: number;

  private constructor(questionResult: number) {
    this._questionResult = questionResult;
  }

  static create(
    questionResult: number,
  ): Either<InvalidQuestionResultError, QuestionResultNote> {
    if (!QuestionResultNote._validate(questionResult)) {
      return left(new InvalidQuestionResultError());
    }
    return right(new QuestionResultNote(questionResult));
  }

  static _validate(questionResult: number): boolean {
    if (!Number.isInteger(questionResult)) {
      return false;
    }

    if (questionResult < 0) {
      return false;
    }

    return true;
  }

  get value(): number {
    return this._questionResult;
  }
}
