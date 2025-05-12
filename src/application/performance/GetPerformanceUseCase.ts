import { UseCase } from '../../shared/UseCase.js';
import { PerformanceEmblems } from './emblems/PerformanceEmblems.js';

type UserInfo = {
  _id: string;
  email: string;
  name: string;
  preferredStartDate: string;
  studyAvailability: {
    sunday: number;
    monday: number;
    tuesday: number;
    wednesday: number;
    thursday: number;
    friday: number;
    saturday: number;
  };
  createdAt: Date;
  updatedAt: Date;
  onboardingComplete?: boolean;
};

export interface Task {
  _id: string;
  ownerId: string;
  topicId: string;
  finished?: boolean;
  type: string;
  estimatedTimeToComplete?: number;
  createdAt: Date;
  updatedAt: Date;
  plannedDate?: string;
  completedOn?: string;
  elapsedTimeInSeconds?: number;
}

export interface UserData {
  userInfo: UserInfo;
  tasksPerUser: Task[];
}

declare global {
  interface Date {
    getDayName(): string;
  }
}

Date.prototype.getDayName = function () {
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ];
  return days[this.getDay()];
};

// Restante do seu código
function calculateLastConsecutiveDays(
  tasks: Task[],
  studyAvailability: { [key: string]: number },
): number {
  const currentDate = new Date();
  const sortedTasks = tasks
    .filter(
      (task) =>
        task.completedOn &&
        task.elapsedTimeInSeconds !== undefined &&
        new Date(task.completedOn) <= currentDate,
    )
    .sort(
      (a, b) =>
        new Date(a.completedOn!).getTime() - new Date(b.completedOn!).getTime(),
    );

  let consecutiveDays = 0;
  let lastCompletedOn: Date | null = null;

  for (const task of sortedTasks) {
    const currentCompletedOn = new Date(task.completedOn!);
    const dayName = currentCompletedOn.getDayName().toLowerCase();

    if (
      task.elapsedTimeInSeconds! >= studyAvailability[dayName] &&
      (!lastCompletedOn ||
        currentCompletedOn.getDate() === lastCompletedOn.getDate() + 1)
    ) {
      consecutiveDays++;
    } else {
      consecutiveDays = 1;
    }

    lastCompletedOn = currentCompletedOn;
  }

  return consecutiveDays;
}
export class GetPerformanceUseCase implements UseCase {
  execute(data: UserData) {
    const tasksCompleted = data.tasksPerUser.filter((task) => task.finished);
    const totalTasks = data.tasksPerUser.length;
    const percentageCompleted = (tasksCompleted.length / totalTasks) * 100;
    const plannedTasksToday = data.tasksPerUser.filter(
      (task) =>
        task.plannedDate &&
        new Date(task.plannedDate + 'T00:00:00')?.toDateString() ===
          new Date().toDateString(),
    );

    const consecutiveDays = calculateLastConsecutiveDays(
      data.tasksPerUser,
      data.userInfo.studyAvailability,
    );

    const weeksCompleted = Math.floor(consecutiveDays / 7);

    const totalElapsedTimeInSeconds: number = tasksCompleted.reduce(
      (total, task) => total + (task.elapsedTimeInSeconds || 0),
      0,
    );

    const totalStudyHours = totalElapsedTimeInSeconds / 3600;

    const performanceEmblems = new PerformanceEmblems();

    const userLevel = performanceEmblems.level(consecutiveDays);
    const userFrequency = performanceEmblems.frequency(data.tasksPerUser);
    const userDedication = performanceEmblems.dedication(data.tasksPerUser);

    return {
      percentageCompleted: percentageCompleted,
      weeksCompleted: weeksCompleted,
      totalStudyHours: totalStudyHours,
      consecutiveDays: consecutiveDays,
      totalTaskToday: plannedTasksToday.length,
      totalTasksCompletedToday: plannedTasksToday.filter(
        (task) => task.finished,
      ).length,
      emblems: {
        userLevel: userLevel,
        userFrequency: userFrequency,
        userDedication: userDedication,
      },
    };
  }
}
