import { CalendarDate } from "../CalendarDate.js";
import { Task } from "../task/Task.js";

type TaskWithMetadata = {
  task: Task;
  finalRelevance: number;
  topicRelevance: number;
  performanceFactor: number;
  daysLateFactor: number;
}

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

export class TaskOrderingService {
  constructor(
    private tasks: Task[],
    private userSubjectsStatus: UserSubjectsStatus,
  ) {
  }

  orderedTasks(): TaskWithMetadata[] {
    const topicIdMapToTopic = new Map(
      this.userSubjectsStatus.subjects
        .flatMap((subject) =>
          subject.topics.map((topic) => {
            const result = {
              ...topic,
              relevance: subject.relevance * topic.relevance,
              performance: 0,
            };
            if ((topic.hits ?? 0) + (topic.misses ?? 0) <= 10) {
              result.performance =
                (subject.hits ?? 0) + (subject.misses ?? 0) !== 0
                  ? subject.hits ??
                    0 / ((subject.hits ?? 0) + (subject.misses ?? 0))
                  : 0;
            } else {
              result.performance =
                (topic.hits ?? 0) + (topic.misses ?? 0) !== 0
                  ? (topic.hits ?? 0) /
                    ((topic.hits ?? 0) + (topic.misses ?? 0))
                  : 0;
            }
            return result;
          }),
        )
        .map((topic) => [topic.topicId, topic]),
    );
    const tasksWithRelevance = this.tasks.map((task) => {
      const statsForTopic = topicIdMapToTopic.get(task.data.topicId.value);
      const taskSubjectRelevance = statsForTopic?.relevance ?? 0;
      const taskPerformance = statsForTopic?.performance ?? 0;
      const taskLastSeenWeight = task.data.plannedDate
        ? this.calculateWeightByDateDifference(
            CalendarDate.today(),
            task.data.plannedDate,
          )
        : 0;
      return {
        task,
        relevance:
          taskSubjectRelevance * (1 - taskPerformance) + taskLastSeenWeight,
        subjectRelevance: taskSubjectRelevance,
        performance: taskPerformance,
        lastSeenWeight: taskLastSeenWeight,
      };
    });

    return tasksWithRelevance.sort((a, b) => b.relevance - a.relevance).map(t => ({
      task: t.task,
      finalRelevance: t.relevance,
      topicRelevance: t.subjectRelevance,
      performanceFactor: t.performance,
      daysLateFactor: t.lastSeenWeight,
    }));
  }
  
  private calculateWeightByDateDifference(
    referenceDate: CalendarDate,
    date: CalendarDate,
  ) {
    const daysDifference = date.diffInDays(referenceDate);
    if (daysDifference < 0) return 0;
    if (daysDifference === 0) return 1;
    if (daysDifference < 7) return 1 + daysDifference / 8;
    if (daysDifference < 14) return 1 + daysDifference / 4;
    return 1 + daysDifference / 2;
  }
}
