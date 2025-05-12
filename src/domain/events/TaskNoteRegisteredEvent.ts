import { DomainEvent } from '../../shared/DomainEvent.js';
import { CalendarDate } from '../CalendarDate.js';
import { ID } from '../Id.js';
import { CommentNote } from '../taskNote/CommentNote.js';
import { QuestionResultNote } from '../taskNote/QuestionResultNote.js';

export type TaskNoteRegisteredEventPayload = {
  taskId: ID;
  commentNote?: CommentNote;
  correctCount?: QuestionResultNote;
  incorrectCount?: QuestionResultNote;
  previousCorrectCount?: QuestionResultNote;
  previousIncorrectCount?: QuestionResultNote;
  previousCommentNote?: CommentNote;
  userId: ID;
  topicId: ID;
  date: CalendarDate;
};

export class TaskNoteRegisteredEvent extends DomainEvent {
  static eventName = 'TaskNoteRegistered';
  constructor(public data: TaskNoteRegisteredEventPayload) {
    super('TaskNoteRegistered');
    this.data = data;
  }
}
