import { Task } from '../GetPerformanceUseCase.js';

export class PerformanceEmblems {
  level = (consecutiveDays: number): string => {
    const weeksCompleted = Math.floor(consecutiveDays / 7);

    if (weeksCompleted >= 8) {
      return 'Imbatível';
    } else if (weeksCompleted >= 4) {
      return 'Mestre';
    } else if (weeksCompleted >= 2) {
      return 'Profissional';
    } else if (weeksCompleted >= 1) {
      return 'Determinado';
    }

    return 'Novato';
  };

  frequency = (tasks: Task[]): string => {
    const completedDays = tasks
      .filter((task) => task.completedOn)
      .map((task) => new Date(task.completedOn!).getDay());

    if (completedDays.length === 0) {
      return 'Regular';
    }

    const sortedDays = completedDays.sort();
    const firstDay = sortedDays[0];
    const lastDay = sortedDays[sortedDays.length - 1];

    for (let i = firstDay; i <= lastDay; i++) {
      if (!sortedDays.includes(i)) {
        return 'Esforçado';
      }
    }

    return 'Engajado';
  };

  dedication = (tasks: Task[]): string => {
    const weeksCompleted = tasks.reduce((totalWeeks, task) => {
      if (
        task.elapsedTimeInSeconds !== undefined &&
        task.estimatedTimeToComplete &&
        task.elapsedTimeInSeconds / 60 >= task.estimatedTimeToComplete
      ) {
        return totalWeeks + 1;
      }
      return totalWeeks;
    }, 0);

    if (weeksCompleted >= 4) {
      return '100% focado';
    } else if (weeksCompleted >= 2) {
      return 'Comprometido';
    } else if (weeksCompleted >= 1) {
      return 'Disciplinado';
    }

    return 'Iniciante';
  };
}
