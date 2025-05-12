import { CalendarDate } from '../../../domain/CalendarDate.js';
import { ID } from '../../../domain/Id.js';
import { ElapsedTimeInSeconds } from '../../../domain/task/ElapsedTimeInSeconds.js';
import { Task, TaskType } from '../../../domain/task/Task.js';
import { CommentNote } from '../../../domain/taskNote/CommentNote.js';
import { QuestionResultNote } from '../../../domain/taskNote/QuestionResultNote.js';
import { TaskNote } from '../../../domain/taskNote/TaskNote.js';
import { TimespanInMinutes } from '../../../domain/user/TimespanInMinutes.js';
import { TaskModel } from './models/TaskModel.js';

export interface PerformanceAggregationResult {
  _id: {
    courseId: string;
    topicId: string;
  };
  correct: number;
  incorrect: number;
}

export class TaskQuery {
  async ofUser(userId: ID): Promise<Task[]> {
    const taskData = await TaskModel.find({ ownerId: userId.value }).exec();
    return taskData.map((v) => {
      return Task.create({
        id: ID.create(v._id),
        courseId: ID.create(v.courseId),
        ownerId: ID.create(v.ownerId),
        topicId: ID.create(v.topicId),
        type: v.type as TaskType,
        note: v.note
          ? TaskNote.create({
              commentNote: v.note.comment
                ? (CommentNote.create(v.note.comment).value as CommentNote)
                : undefined,
              correctCount: v.note.correctCount
                ? (QuestionResultNote.create(v.note.correctCount)
                    .value as QuestionResultNote)
                : undefined,
              incorrectCount: v.note.incorrectCount
                ? (QuestionResultNote.create(v.note.incorrectCount)
                    .value as QuestionResultNote)
                : undefined,
              taskId: ID.create(v.note.taskId),
              userId,
              createdAt: v.note.createdAt,
            }).value
          : undefined,
        plannedDate: v.plannedDate
          ? (CalendarDate.fromString(v.plannedDate).value as CalendarDate)
          : undefined,
        cycle: v.cycle,
        isExtra: v.isExtra,
        completedOn: v.completedOn
          ? (CalendarDate.fromString(v.completedOn).value as CalendarDate)
          : undefined,
        elapsedTimeInSeconds: v.elapsedTimeInSeconds
          ? (ElapsedTimeInSeconds.create(v.elapsedTimeInSeconds)
              .value as ElapsedTimeInSeconds)
          : undefined,
        finished: v.finished,
        estimatedTimeToComplete: v.estimatedTimeToComplete
          ? (TimespanInMinutes.create(v.estimatedTimeToComplete)
              .value as TimespanInMinutes)
          : undefined,
      }).value;
    });
  }

  async ofAllExcept(userId: ID): Promise<Task[]> {
    const tasks = await TaskModel.find({ ownerId: { $ne: userId.value } })
      .lean()
      .exec();

    return tasks.map((v) => {
      return Task.create({
        id: ID.create(v._id),
        courseId: ID.create(v.courseId),
        ownerId: ID.create(v.ownerId),
        topicId: ID.create(v.topicId),
        type: v.type as TaskType,
        note: v.note
          ? TaskNote.create({
              commentNote: v.note.comment
                ? (CommentNote.create(v.note.comment).value as CommentNote)
                : undefined,
              correctCount: v.note.correctCount
                ? (QuestionResultNote.create(v.note.correctCount)
                    .value as QuestionResultNote)
                : undefined,
              incorrectCount: v.note.incorrectCount
                ? (QuestionResultNote.create(v.note.incorrectCount)
                    .value as QuestionResultNote)
                : undefined,
              taskId: ID.create(v.note.taskId),
              userId,
              createdAt: v.note.createdAt,
            }).value
          : undefined,
        plannedDate: v.plannedDate
          ? (CalendarDate.fromString(v.plannedDate).value as CalendarDate)
          : undefined,
        cycle: v.cycle,
        isExtra: v.isExtra,
        completedOn: v.completedOn
          ? (CalendarDate.fromString(v.completedOn).value as CalendarDate)
          : undefined,
        elapsedTimeInSeconds: v.elapsedTimeInSeconds
          ? (ElapsedTimeInSeconds.create(v.elapsedTimeInSeconds)
              .value as ElapsedTimeInSeconds)
          : undefined,
        finished: v.finished,
        estimatedTimeToComplete: v.estimatedTimeToComplete
          ? (TimespanInMinutes.create(v.estimatedTimeToComplete)
              .value as TimespanInMinutes)
          : undefined,
      }).value;
    });
  }

  async aggregatePerformanceExcludingUser(
    userId: ID,
  ): Promise<PerformanceAggregationResult[]> {
    /**
     * O pipeline faz o seguinte:
     * 1) $match -> filtra tasks cujo ownerId != userId.value
     * 2) $group -> agrupa por {courseId, topicId}, somando os valores de correct/incorrect
     *    usando $ifNull para evitar soma com null.
     */
    const pipeline = [
      {
        $match: {
          ownerId: { $ne: userId.value },
        },
      },
      {
        $group: {
          _id: {
            courseId: '$courseId',
            topicId: '$topicId',
          },
          correct: {
            $sum: {
              $ifNull: ['$note.correctCount', 0],
            },
          },
          incorrect: {
            $sum: {
              $ifNull: ['$note.incorrectCount', 0],
            },
          },
        },
      },
    ];

    return TaskModel.aggregate<PerformanceAggregationResult>(pipeline).exec();
  }
}
