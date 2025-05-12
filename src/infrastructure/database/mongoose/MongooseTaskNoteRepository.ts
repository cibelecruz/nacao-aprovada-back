import { ID } from '../../../domain/Id.js';
import { CommentNote } from '../../../domain/taskNote/CommentNote.js';
import { QuestionResultNote } from '../../../domain/taskNote/QuestionResultNote.js';
import { TaskNote } from '../../../domain/taskNote/TaskNote.js';
import type { TaskNoteRepository } from '../../../domain/taskNote/TaskNoteRepository.js';
import { Repository } from '../../../shared/Repository.js';
import { TaskNoteModel } from './models/TaskNoteModel.js';

export class MongooseTaskNoteRepository
  extends Repository
  implements TaskNoteRepository
{
  async create(taskNote: TaskNote): Promise<void> {
    await new TaskNoteModel({
      _id: taskNote.data.id,
      taskId: taskNote.data.taskId,
      correctCount: taskNote.data.correctCount,
      incorrectCount: taskNote.data.incorrectCount,
      note: taskNote.data.commentNote,
    }).save();
  }

  async save(taskNote: TaskNote): Promise<void> {
    await TaskNoteModel.updateOne(
      {
        _id: taskNote.data.id,
      },
      {
        correctCount: taskNote.data.correctCount,
        note: taskNote.data.commentNote,
        incorrectCount: taskNote.data.incorrectCount,
      },
    ).exec();
  }

  async ofId(id: ID): Promise<TaskNote | null> {
    const task = await TaskNoteModel.findById(id.value).lean().exec();

    let noteOrError;

    if (task?.note) {
      noteOrError = CommentNote.create(task?.note);
    }

    let correctCountOrError;

    if (task?.correctCount) {
      correctCountOrError = QuestionResultNote.create(task.correctCount);
    }

    let incorrectCountOrError;

    if (task?.incorrectCount) {
      incorrectCountOrError = QuestionResultNote.create(task.incorrectCount);
    }

    const taskNote = TaskNote.create({
      commentNote: noteOrError?.isRight() ? noteOrError.value : undefined,
      correctCount: correctCountOrError?.isRight()
        ? correctCountOrError.value
        : undefined,

      incorrectCount: incorrectCountOrError?.isRight()
        ? incorrectCountOrError.value
        : undefined,
      taskId: ID.create(task?.taskId),
      userId: ID.create(task?.userId),
    });

    return taskNote.value;
  }

  async delete(id: ID): Promise<void> {
    const result = await TaskNoteModel.deleteOne()
      .where({ _id: id.value })
      .exec();

    if (result.deletedCount === 0) {
      throw new Error('Task not found.');
    }
  }
}
