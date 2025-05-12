import assert from 'assert';
import { Task } from '../../domain/task/Task.js';
import {
  MongooseUserDailyProgress,
  UserDailyProgressPayload,
} from '../../infrastructure/database/mongoose/MongooseUserDailyProgressDAO.js';
import { TaskNoteRegisteredEventPayload } from '../../domain/events/TaskNoteRegisteredEvent.js';

export class DailyProgressService {
  constructor(
    private readonly userDailyProgressDAO: MongooseUserDailyProgress,
  ) {}
  async handleTaskCompletion(payload: Task): Promise<void> {
    assert(payload.isCompleted());

    const userDailyProgress =
      await this.userDailyProgressDAO.findByUserIdAndDate(
        payload.data.ownerId.value,
        payload.data.completedOn.value,
      );

    if (!userDailyProgress) {
      const savePayload: UserDailyProgressPayload = {
        userId: payload.data.ownerId.value,
        date: payload.data.completedOn.value,
        completedTasks: [payload.data.id.value],
        aggregatedStudyTime: payload.data.elapsedTimeInSeconds?.value ?? 0,
        subjectsStudied: [payload.data.topicId.value],
        performances: [],
        totalCorrectAmount: 0,
        totalIncorrectAmount: 0,
      };
      await this.userDailyProgressDAO.create(savePayload);
      return;
    }

    const newSubjectsStudied =
      payload.data.type === 'study'
        ? [...userDailyProgress.subjectsStudied, payload.data.topicId.value]
        : undefined;

    const updatedUserDailyProgress = {
      _id: userDailyProgress._id,
      completedTasks: [
        ...userDailyProgress.completedTasks,
        payload.data.id.value,
      ],
      aggregatedStudyTime:
        userDailyProgress.aggregatedStudyTime +
        (payload.data.elapsedTimeInSeconds?.value ?? 0),
      subjectsStudied: newSubjectsStudied,
    };
    await this.userDailyProgressDAO.update(updatedUserDailyProgress);
  }

  async handleTaskNoteRegistration(
    payload: TaskNoteRegisteredEventPayload,
  ): Promise<void> {
    const userDailyProgress =
      await this.userDailyProgressDAO.findByUserIdAndDate(
        payload.userId.value,
        payload.date.toString(),
      );

    if (!userDailyProgress) {
      const newStudyProgress: UserDailyProgressPayload = {
        userId: payload.userId.value,
        date: payload.date.toString(),
        completedTasks: [],
        aggregatedStudyTime: 0,
        subjectsStudied: [],
        performances: [
          {
            taskId: payload.taskId.value,
            topicId: payload.topicId.value,
            incorrectAmount: payload.incorrectCount?.value ?? 0,
            correctAmount: payload.correctCount?.value ?? 0,
          },
        ],
        totalCorrectAmount: payload.correctCount?.value,
        totalIncorrectAmount: payload.incorrectCount?.value,
      };
      await this.userDailyProgressDAO.create(newStudyProgress);
      return;
    }

    const newPerformances: UserDailyProgressPayload['performances'] =
      userDailyProgress.performances.map((p) => {
        if (p.taskId === payload.taskId.value) {
          return {
            ...p,
            correctAmount: payload.correctCount
              ? payload.correctCount.value
              : p.correctAmount,
            incorrectAmount: payload.incorrectCount
              ? payload.incorrectCount.value
              : p.incorrectAmount,
          };
        }
        return p;
      });

    const previousTaskPerformance = userDailyProgress.performances.find(
      (performance) => performance.taskId === payload.taskId.value,
    );

    if (!previousTaskPerformance) {
      newPerformances.push({
        taskId: payload.taskId.value,
        topicId: payload.topicId.value,
        correctAmount: payload.correctCount?.value ?? 0,
        incorrectAmount: payload.incorrectCount?.value ?? 0,
      });
    }

    const updatedUserDailyProgress = {
      performances: newPerformances,
      totalCorrectAmount: userDailyProgress.totalCorrectAmount ?? 0,
      totalIncorrectAmount: userDailyProgress.totalIncorrectAmount ?? 0,
    };

    if (payload.correctCount !== undefined) {
      updatedUserDailyProgress.totalCorrectAmount =
        (userDailyProgress.totalCorrectAmount ?? 0) -
        (previousTaskPerformance?.correctAmount ?? 0) +
        (payload.correctCount?.value ?? 0);
    }

    if (payload.incorrectCount !== undefined) {
      updatedUserDailyProgress.totalIncorrectAmount =
        (userDailyProgress.totalIncorrectAmount ?? 0) -
        (previousTaskPerformance?.incorrectAmount ?? 0) +
        (payload.incorrectCount?.value ?? 0);
    }

    await this.userDailyProgressDAO.update({
      _id: userDailyProgress._id,
      ...updatedUserDailyProgress,
    });
  }
}
