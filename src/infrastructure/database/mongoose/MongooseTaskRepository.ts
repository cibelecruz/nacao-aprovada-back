import { CalendarDate } from '../../../domain/CalendarDate.js';
import { ID } from '../../../domain/Id.js';
import { ElapsedTimeInSeconds } from '../../../domain/task/ElapsedTimeInSeconds.js';
import { Task, TaskType } from '../../../domain/task/Task.js';
import { TaskRepository } from '../../../domain/task/TaskRepository.js';
import { CommentNote } from '../../../domain/taskNote/CommentNote.js';
import { QuestionResultNote } from '../../../domain/taskNote/QuestionResultNote.js';
import { TaskNote } from '../../../domain/taskNote/TaskNote.js';
import { TimespanInMinutes } from '../../../domain/user/TimespanInMinutes.js';
import { EventDispatcher } from '../../../shared/EventDispatcher.js';
import { Repository } from '../../../shared/Repository.js';
import { TaskModel } from './models/TaskModel.js';

export class MongooseTaskRepository
  extends Repository
  implements TaskRepository
{
  constructor(eventDispatcher: EventDispatcher) {
    super(eventDispatcher);
  }

  async create(task: Task): Promise<void> {
    const taskNote = task.data.note;
    await new TaskModel({
      _id: task.data.id.value,
      completedOn: task.data.completedOn?.value,
      elapsedTimeInSeconds: task.data.elapsedTimeInSeconds?.value,
      estimatedTimeToComplete: task.data.estimatedTimeToComplete.minutes,
      ownerId: task.data.ownerId.value,
      topicId: task.data.topicId.value,
      plannedDate: task.data.plannedDate?.value,
      cycle: task.data.cycle,
      type: task.data.type,
      finished: task.data.finished,
      isExtra: task.data.isExtra,
      courseId: task.data.courseId,
      note: {
        comment: taskNote?.data.commentNote?.value,
        correctCount: taskNote?.data.correctCount?.value,
        incorrectCount: taskNote?.data.incorrectCount?.value,
      },
    }).save();
    await this.dispatchEvents(task);
  }

  async save(task: Task): Promise<void> {
    await TaskModel.updateOne(
      {
        _id: task.data.id.value,
        ownerId: task.data.ownerId.value,
      },
      {
        completedOn: task.data.completedOn?.value,
        elapsedTimeInSeconds: task.data.elapsedTimeInSeconds?.value,
        finished: task.data.finished,
        note: {
          comment: task.data.note?.data.commentNote?.value,
          correctCount: task.data.note?.data.correctCount?.value,
          incorrectCount: task.data.note?.data.incorrectCount?.value,
        },
      },
    ).exec();
    await this.dispatchEvents(task);
  }

  async ofId(id: ID): Promise<Task | null> {
    const task = await TaskModel.findById(id.value).lean().exec();
    if (!task) {
      return null;
    }
    return Task.create({
      id: ID.create(task._id),
      courseId: ID.create(task.courseId),
      ownerId: ID.create(task.ownerId),
      topicId: ID.create(task.topicId),
      type: task.type as TaskType,
      cycle: task.cycle,
      isExtra: task.isExtra,
      plannedDate: task.plannedDate
        ? (CalendarDate.fromString(task.plannedDate).value as CalendarDate)
        : undefined,
      completedOn: task.completedOn
        ? (CalendarDate.fromString(task.completedOn).value as CalendarDate)
        : undefined,
      elapsedTimeInSeconds: task.elapsedTimeInSeconds
        ? (ElapsedTimeInSeconds.create(task.elapsedTimeInSeconds)
            .value as ElapsedTimeInSeconds)
        : undefined,
      finished: task.finished ? task.finished : undefined,
      estimatedTimeToComplete: task.estimatedTimeToComplete
        ? (TimespanInMinutes.create(task.estimatedTimeToComplete)
            .value as TimespanInMinutes)
        : undefined,
      note: task.note
        ? TaskNote.create({
            commentNote: task.note.comment
              ? (CommentNote.create(task.note.comment).value as CommentNote)
              : undefined,
            correctCount: task.note.correctCount
              ? (QuestionResultNote.create(task.note.correctCount)
                  .value as QuestionResultNote)
              : undefined,
            incorrectCount: task.note.incorrectCount
              ? (QuestionResultNote.create(task.note.incorrectCount)
                  .value as QuestionResultNote)
              : undefined,
            taskId: ID.create(task.note.taskId),
            userId: ID.create(task.ownerId),
          }).value
        : undefined,
    }).value;
  }

  async topicsThatHaveTasks(userId: ID): Promise<ID[]> {
    const result = await TaskModel.aggregate<{
      _id: string;
      topics: string[];
    }>()
      .match({ ownerId: userId.value })
      .group({ _id: '$ownerId', topics: { $addToSet: '$topicId' } })
      .exec();

    return result.length > 0
      ? result[0].topics.map((id) => ID.parse(id).value as ID)
      : [];
  }

  async delete(id: ID): Promise<void> {
    const result = await TaskModel.deleteOne().where({ _id: id.value }).exec();

    if (result.deletedCount === 0) {
      throw new Error('Task not found.');
    }
  }

  async deleteByUserAndCourse(userId: ID, courseId: ID): Promise<void> {
    await TaskModel.deleteMany({
      ownerId: userId.value,
      courseId: courseId.value,
    }).exec();
  }
}
