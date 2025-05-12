import { InvalidCommentError } from '../../errors/InvalidCommentError.js';
import { InvalidQuestionResultError } from '../../errors/InvalidQuestionResultError.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { ID } from '../Id.js';
import { CommentNote } from './CommentNote.js';
import { QuestionResultNote } from './QuestionResultNote.js';

export interface TaskNoteData {
  id: ID;
  userId: ID;
  taskId: ID;
  commentNote?: CommentNote;
  correctCount?: QuestionResultNote;
  incorrectCount?: QuestionResultNote;
  createdAt: Date;
}

type CreateTaskNoteProps = {
  id?: ID;
  userId: ID;
  taskId: ID;
  commentNote?: CommentNote;
  correctCount?: QuestionResultNote;
  incorrectCount?: QuestionResultNote;
  createdAt?: Date;
};

export class TaskNote {
  constructor(private readonly _data: TaskNoteData) {}

  setComment(note: string): Either<InvalidCommentError, undefined> {
    const result = CommentNote.create(note);
    if (result.isLeft()) {
      return left(result.value);
    }
    this._data.commentNote = result.value;
    return right(undefined);
  }

  setCorrectCount(
    correctCount: number,
  ): Either<InvalidQuestionResultError, undefined> {
    const result = QuestionResultNote.create(correctCount);
    if (result.isLeft()) {
      return left(result.value);
    }
    this._data.correctCount = result.value;
    return right(undefined);
  }

  setIncorrectCount(
    incorrectCount: number,
  ): Either<InvalidQuestionResultError, undefined> {
    const result = QuestionResultNote.create(incorrectCount);
    if (result.isLeft()) {
      return left(result.value);
    }
    this._data.incorrectCount = result.value;
    return right(undefined);
  }

  get data() {
    return this._data;
  }

  static create(data: CreateTaskNoteProps): Either<never, TaskNote> {
    return right(
      new TaskNote({
        id: data.id ?? ID.create(),
        userId: data.userId,
        taskId: data.taskId,
        commentNote: data.commentNote,
        correctCount: data.correctCount,
        incorrectCount: data.incorrectCount,
        createdAt: data.createdAt ?? new Date(),
      }),
    );
  }
}
