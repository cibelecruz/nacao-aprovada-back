import { Either, right } from '../../shared/utils/Either.js';
import { UseCase } from '../../shared/UseCase.js';
import { ID } from '../../domain/Id.js';
import { Task } from '../../domain/task/Task.js';
import {
  PlannedTask,
  UserSchedule,
} from '../../domain/scheduler/UserSchedule.js';
import { UserStudyAvailability } from '../../domain/user/UserStudyAvailability.js';
import { CalendarDate } from '../../domain/CalendarDate.js';
import { DateRange } from '../../domain/DateRange.js';

type GetTasksTimelineUseCaseProps = {
  requesterId: ID;
  userStudyAvailability: UserStudyAvailability;
  preferredStartDate: CalendarDate;
  courseSchedule: UserSubjectsStatus;
  tasks: Task[];
  dateRange: DateRange;
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

export class GetTasksTimelineUseCase implements UseCase {
  execute(
    data: GetTasksTimelineUseCaseProps,
  ): Either<never, { tasks: PlannedTask[] }> {
    const {
      userStudyAvailability,
      preferredStartDate,
      tasks,
      dateRange,
      courseSchedule,
    } = data;

    const userSchedule = new UserSchedule(
      userStudyAvailability,
      preferredStartDate,
      tasks,
      courseSchedule,
    );

    const tasksTimeline: PlannedTask[] =
      userSchedule.tasksTimelineFor(dateRange);

    return right({ tasks: tasksTimeline });
  }
}
