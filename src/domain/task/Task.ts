import { UnauthorizedTaskManipulation } from '../../errors/UnauthorizedTaskManipulation.js';
import { Entity } from '../../shared/Entity.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { WithPartial } from '../../shared/utils/WithPartial.js';
import { CalendarDate } from '../CalendarDate.js';
import { ID } from '../Id.js';
import { TaskCompletedEvent } from '../events/TaskCompletedEvent.js';
import { TaskNoteRegisteredEvent } from '../events/TaskNoteRegisteredEvent.js';
import { TaskUncompleteEvent } from '../events/TaskUncompleteEvent.js';
import { CommentNote } from '../taskNote/CommentNote.js';
import { QuestionResultNote } from '../taskNote/QuestionResultNote.js';
import { TaskNote } from '../taskNote/TaskNote.js';
import { TimespanInMinutes } from '../user/TimespanInMinutes.js';
import { ElapsedTimeInSeconds } from './ElapsedTimeInSeconds.js';

export type TaskType = 'study' | 'lawStudy' | 'exercise' | 'review';

type RegisterNoteProps = {
  commentNote?: CommentNote;
  correctCount?: QuestionResultNote;
  incorrectCount?: QuestionResultNote;
};

export type TaskData = {
  id: ID;
  ownerId: ID;
  topicId: ID;
  courseId: ID;
  cycle: number;
  completedOn?: CalendarDate;
  plannedDate?: CalendarDate;
  elapsedTimeInSeconds?: ElapsedTimeInSeconds;
  finished: boolean;
  type: TaskType;
  estimatedTimeToComplete: TimespanInMinutes;
  isExtra: boolean;
  note?: TaskNote;
};

export class Task extends Entity {
  constructor(private readonly _data: TaskData) {
    super();
  }

  get data() {
    return this._data;
  }

  private isOwnedBy(userId: ID) {
    return userId.value === this._data.ownerId.value;
  }

  complete(requesterId: ID): Either<UnauthorizedTaskManipulation, undefined> {
    if (!this.isOwnedBy(requesterId)) {
      return left(new UnauthorizedTaskManipulation());
    }

    this._data.finished = true;
    this._data.completedOn = CalendarDate.today();
    this.addDomainEvent(new TaskCompletedEvent(this));
    return right(undefined);
  }

  uncomplete(requesterId: ID): Either<UnauthorizedTaskManipulation, undefined> {
    if (!this.isOwnedBy(requesterId)) {
      return left(new UnauthorizedTaskManipulation());
    }

    this._data.finished = false;
    this._data.completedOn = undefined;
    this.addDomainEvent(new TaskUncompleteEvent(this));
    return right(undefined);
  }

  studentRemove(
    requesterId: ID,
  ): Either<UnauthorizedTaskManipulation, undefined> {
    if (!this.isOwnedBy(requesterId)) {
      return left(new UnauthorizedTaskManipulation());
    }

    return right(undefined);
  }

  isCompleted(): this is {
    data: TaskData & { completedOn: CalendarDate; finished: boolean };
  } {
    return this._data.finished === true && this._data.completedOn !== undefined;
  }

  isExtra() {
    return this._data.isExtra === true;
  }

  setElapsedTime(
    requesterId: ID,
    elapsedTimeInSeconds: ElapsedTimeInSeconds,
  ): Either<UnauthorizedTaskManipulation, undefined> {
    if (!this.isOwnedBy(requesterId)) {
      return left(new UnauthorizedTaskManipulation());
    }

    this._data.elapsedTimeInSeconds = elapsedTimeInSeconds;

    return right(undefined);
  }

  registerNote(
    requesterId: ID,
    note: RegisterNoteProps,
  ): Either<UnauthorizedTaskManipulation, TaskNote> {
    if (!this.isOwnedBy(requesterId)) {
      return left(new UnauthorizedTaskManipulation());
    }

    const previousTaskNote = {
      correctCount: this._data.note?.data.correctCount,
      incorrectCount: this._data.note?.data.incorrectCount,
      commentNote: this._data.note?.data.commentNote,
    };

    const taskNote = TaskNote.create({
      commentNote: note.commentNote ?? previousTaskNote.commentNote,
      correctCount: note.correctCount ?? previousTaskNote.correctCount,
      incorrectCount: note.incorrectCount ?? previousTaskNote.incorrectCount,
      userId: requesterId,
      taskId: this._data.id,
    });

    if (taskNote.isLeft()) {
      return left(taskNote.value);
    }

    this._data.note = taskNote.value;
    this.addDomainEvent(
      new TaskNoteRegisteredEvent({
        topicId: this._data.topicId,
        taskId: this._data.id,
        previousCorrectCount: previousTaskNote.correctCount,
        previousIncorrectCount: previousTaskNote.incorrectCount,
        commentNote: note.commentNote,
        correctCount: note.correctCount,
        incorrectCount: note.incorrectCount,
        userId: requesterId,
        date: CalendarDate.today(),
      }),
    );

    return taskNote;
  }

  static create(
    data: WithPartial<
      TaskData,
      | 'id'
      | 'finished'
      | 'estimatedTimeToComplete'
      | 'type'
      | 'cycle'
      | 'isExtra'
    >,
  ): Either<never, Task> {
    return right(
      new Task({
        id: data.id ?? ID.create(),
        courseId: data.courseId,
        ownerId: data.ownerId,
        topicId: data.topicId,
        cycle: data.cycle ?? 0,
        completedOn: data.completedOn,
        elapsedTimeInSeconds: data.elapsedTimeInSeconds,
        finished: data.finished ?? false,
        type: data.type ?? 'study',
        plannedDate: data.plannedDate,
        estimatedTimeToComplete:
          data.estimatedTimeToComplete ?? TimespanInMinutes.default(),
        isExtra: data.isExtra ?? false,
        note: data.note,
      }),
    );
  }
}
