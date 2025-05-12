import { Either, left, right } from '../../shared/utils/Either.js';
import { InvalidCommentError } from '../../errors/InvalidCommentError.js';

export class CommentNote {
  private readonly _note: string;
  private static readonly MAX_LENGTH = 1000;

  private constructor(note: string) {
    this._note = note;
  }

  static create(note: string): Either<InvalidCommentError, CommentNote> {
    if (!CommentNote._validate(note)) {
      return left(new InvalidCommentError(note));
    }
    return right(new CommentNote(note));
  }

  static _validate(note: string): boolean {
    return note.trim().length > 0 && note.length <= CommentNote.MAX_LENGTH;
  }

  get value(): string {
    return this._note;
  }

  toString() {
    return this._note;
  }
}
