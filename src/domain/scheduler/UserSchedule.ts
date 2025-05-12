import { CalendarDate } from '../CalendarDate.js';
import { DateRange } from '../DateRange.js';
import { Task } from '../task/Task.js';
import { UserStudyAvailability } from '../user/UserStudyAvailability.js';
import { Weekday } from '../Weekday.js';
import { TimespanInMinutes } from '../user/TimespanInMinutes.js';
import { TaskOrderingService } from './TaskOrderingService.js';

export type PlannedTask = Task['data'] & { plannedDate: CalendarDate };

type TaskWithRelevance = {
  task: Task;
  relevance: number;
};

type UserSubjectsStatus = {
  subjects: {
    subjectId: string;
    relevance: number;
    hits?: number;
    misses?: number;
    topics: {
      topicId: string;
      relevance: number;
      hits?: number;
      misses?: number;
    }[];
  }[];
}

export class UserSchedule {
  private completedTasksByTopicId: Map<string, CalendarDate>;
  private completedTasksByDate: Map<string, Task[]>;
  private taskSubjectByTopicId: Map<string, string>;

  constructor(
    public userStudyAvailability: UserStudyAvailability,
    public preferredStartDate: CalendarDate,
    private tasks: Task[],
    private userSubjectsStatus: UserSubjectsStatus,
  ) {
    this.completedTasksByTopicId = new Map();
    this.completedTasksByDate = new Map();
    const completedTasks = tasks.filter((t) => t.isCompleted());

    completedTasks.forEach((task) => {
      if (task.isCompleted()) {
        const { topicId, completedOn } = task.data;
        this.completedTasksByTopicId.set(topicId.value, completedOn);
        const completedTasksForDate =
          this.completedTasksByDate.get(completedOn.value) || [];
        completedTasksForDate.push(task);
        this.completedTasksByDate.set(completedOn.value, completedTasksForDate);
      }
    });

    this.taskSubjectByTopicId = new Map(
      this.userSubjectsStatus.subjects.flatMap((subject) =>
        subject.topics.map((topic) => [topic.topicId, subject.subjectId]),
      ),
    );
  }

  private sortedTasks(): TaskWithRelevance[] {
    const taskOrderingService = new TaskOrderingService(
      this.tasks,
      this.userSubjectsStatus,
    );
    return taskOrderingService.orderedTasks().map((t) => ({
      task: t.task,
      relevance: t.finalRelevance,
    }));
  }

  tasksTimelineFor(dateRange: DateRange) {
    // tasks cannot repeat subjects on the same day

    const plannedTasks: PlannedTask[] = [];
    let tasksToSchedule: Task[] = this.sortedTasks()
      .map((t) => t.task)
      .filter((t) => !t.isCompleted());
    const consideredDateRange = dateRange.start.isBefore(CalendarDate.today())
      ? dateRange
      : (DateRange.create({ start: CalendarDate.today(), end: dateRange.end })
          .value as DateRange);

    for (let i = 0; i <= consideredDateRange.diffInDays(); i++) {
      const date = consideredDateRange.start.addDays(i);
      const weekDay = Weekday.fromCalendarDate(date);
      const userAvailability =
        this.userStudyAvailability.getAvailability(weekDay);

      if (date.isBefore(CalendarDate.today())) {
        plannedTasks.push(
          ...(this.completedTasksByDate.get(date.value) ?? []).map((t) => ({
            ...t.data,
            plannedDate: t.data.completedOn!,
          })),
        );
        continue;
      }

      if (date.isEqual(CalendarDate.today())) {
        const subjectsPlannedForToday: Set<string> = new Set();

        const completedTasksToday =
          this.completedTasksByDate.get(date.value) ?? [];
        plannedTasks.push(
          ...completedTasksToday.map((t) => ({
            ...t.data,
            plannedDate: t.data.completedOn!,
          })),
        );
        completedTasksToday.forEach((t) =>
          subjectsPlannedForToday.add(
            this.taskSubjectByTopicId.get(t.data.topicId.value) ?? '',
          ),
        );

        const compromisedAvailability = completedTasksToday
          .filter((t) => !t.isExtra())
          .reduce(
            (acc, curr) => acc.add(curr.data.estimatedTimeToComplete),
            TimespanInMinutes.empty(),
          );

        const { scheduledTasks, unscheduledTasks } = this.scheduleTasksForDate(
          userAvailability.subtract(compromisedAvailability),
          tasksToSchedule.filter((t) => !t.isExtra()),
          date,
          subjectsPlannedForToday,
        );

        plannedTasks.push(
          ...scheduledTasks,
          ...tasksToSchedule
            .filter((t) => t.isExtra())
            .map((t) => ({ ...t.data, plannedDate: date })),
        );

        tasksToSchedule = unscheduledTasks;

        continue;
      }

      if (date.isAfter(CalendarDate.today())) {
        const { scheduledTasks, unscheduledTasks } = this.scheduleTasksForDate(
          userAvailability,
          tasksToSchedule,
          date,
        );

        tasksToSchedule = unscheduledTasks;

        plannedTasks.push(...scheduledTasks);
        continue;
      }
    }

    return plannedTasks.filter((t) => dateRange.contains(t.plannedDate));
  }

  private scheduleTasksForDate(
    userAvailability: TimespanInMinutes,
    tasks: Task[],
    date: CalendarDate,
    ignoreSubjects: Set<string> = new Set(),
  ) {
    const scheduledTasks = [];
    const unscheduledTasks = [];
    let remainingAvailability = userAvailability.minutes;

    while (remainingAvailability > 0) {
      const nextTask = tasks.shift();
      if (!nextTask) break;
      const nextTaskSubject =
        this.taskSubjectByTopicId.get(nextTask.data.topicId.value) ?? '';

      if (ignoreSubjects.has(nextTaskSubject)) {
        unscheduledTasks.push(nextTask);
        continue;
      }

      scheduledTasks.push({
        ...nextTask.data,
        plannedDate: date,
      });
      ignoreSubjects.add(nextTaskSubject);

      remainingAvailability -= nextTask.data.estimatedTimeToComplete.minutes;
    }

    return { scheduledTasks, unscheduledTasks: [...unscheduledTasks, ...tasks] };
  }
}
