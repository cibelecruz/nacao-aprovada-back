import { FastifyRequest } from 'fastify';
import { CompleteTaskUseCase } from '../../../../application/task/CompleteTaskUseCase.js';
import {
  HttpResponse,
  BadRequest,
  InternalServerError,
  OK,
  Unauthorized,
  NotFound,
} from '../../utils/responseHelpers.js';
import { ID } from '../../../../domain/Id.js';
import { ElapsedTimeInSeconds } from '../../../../domain/task/ElapsedTimeInSeconds.js';
import { ComputeTaskElapsedTimeUseCase } from '../../../../application/task/ComputeTaskElapsedTimeUseCase.js';
import { DateRange } from '../../../../domain/DateRange.js';
import { GetTasksTimelineUseCase } from '../../../../application/task/GetTasksTimelineUseCase.js';
import { CalendarDate } from '../../../../domain/CalendarDate.js';
import { TaskQuery } from '../../../database/mongoose/TaskQuery.js';
import { CourseNotFoundError } from '../../../../errors/CourseNotFoundError.js';
import { MissingRequiredParamsError } from '../../../../errors/MissingRequiredParamsError.js';
import { UserSubjectsStatusQuery } from '../../../database/mongoose/UserSubjectsStatusQuery.js';
import { TimelineTasksDto } from '../../../../dtos/TimelineTasksDto.js';
import { CreateExtraTaskUseCase } from '../../../../application/task/CreateExtraTaskUseCase.js';
import { TaskType } from '../../../../domain/task/Task.js';
import { MongooseUserRepository } from '../../../database/mongoose/MongooseUserRepository.js';
import { TaskOrderingService } from '../../../../domain/scheduler/TaskOrderingService.js';
import { MongooseCourseQuery } from '../../../database/mongoose/MongooseCourseQuery.js';
import { Either, left, right } from '../../../../shared/utils/Either.js';
import type { UncompleteTaskUseCase } from '../../../../application/task/UncompleteTaskUseCase.js';
import type { StudentRemoveTaskUseCase } from '../../../../application/task/StudentRemoveTaskUseCase.js';
import { MongooseCourseRepository } from '../../../database/mongoose/MongooseCourseRepository.js';

export type TaskElapsedTimeRequestBody = {
  taskId?: string;
  elapsedTimeInSeconds?: number;
};

export type TaskCompleteRequestBody = {
  taskId?: string;
  elapsedTimeInSeconds?: number;
};

export type TaskUncompleteRequestBody = {
  taskId: string;
};

export type GetScheduledTaskRequestBody = {
  startDate: string;
  endDate: string;
};

type CreateExtraTaskRequestBody = {
  topicId: string;
  date: string;
  type: string;
  courseId: string;
};

type TaskControllerUseCases = {
  completeTaskUseCase: CompleteTaskUseCase;
  elapsedTimeUseCase: ComputeTaskElapsedTimeUseCase;
  getTasksTimelineUseCase: GetTasksTimelineUseCase;
  createExtraTaskUseCase: CreateExtraTaskUseCase;
  uncompleteTaskUseCase: UncompleteTaskUseCase;
  studanteRemoveTaskUseCase: StudentRemoveTaskUseCase;
};

type UserSubjectsEnhanced = {
  subjects: {
    subjectId: string;
    name: string;
    relevance: number;
    topics: {
      relevance: number;
      topicId: string;
      name: string;
      hits?: number;
      misses?: number;
    }[];
  }[];
};

type StudantRemoveTaskRequestBody = {
  taskId: string;
};

async function getUserScheduleEnhanced(
  userId: ID,
  courseId: ID,
): Promise<Either<CourseNotFoundError, UserSubjectsEnhanced>> {
  const userSubjectsStatus = new UserSubjectsStatusQuery();
  const courseQuery = new MongooseCourseQuery();

  const userSubjects = await userSubjectsStatus.subjects(userId, courseId);
  const courseSubjects = await courseQuery.subjects(courseId);

  if (userSubjects === null || courseSubjects === null) {
    return left(new CourseNotFoundError());
  }
  const hitsAndMissesMap = new Map(
    userSubjects.hitsAndMisses.map((hm) => [hm.topicId, hm]),
  );

  const userSubjectsEnhanced: UserSubjectsEnhanced = {
    subjects: courseSubjects.map((subject) => ({
      name: subject.name,
      relevance: subject.relevance,
      subjectId: subject.id,
      topics: subject.topics.map((topic) => ({
        hits: hitsAndMissesMap.get(topic.id)?.hits,
        misses: hitsAndMissesMap.get(topic.id)?.misses,
        relevance: topic.relevance,
        topicId: topic.id,
        name: topic.name,
      })),
    })),
  };
  return right(userSubjectsEnhanced);
}

export class TaskController {
  constructor(private readonly useCases: TaskControllerUseCases) {}

  studantRemoveTask = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    const { taskId } = request.body as StudantRemoveTaskRequestBody;
    if (!taskId) {
      return BadRequest(new MissingRequiredParamsError());
    }

    const taskIdOrError = ID.parse(taskId);

    if (taskIdOrError && taskIdOrError.isLeft()) {
      return BadRequest(taskIdOrError.value);
    }

    const registerId = request.user.data.id;

    const studanteRemoveTask =
      await this.useCases.studanteRemoveTaskUseCase.execute({
        requesterId: registerId,
        taskId: taskIdOrError.value,
      });

    if (studanteRemoveTask.isLeft()) {
      return InternalServerError(studanteRemoveTask.value);
    }

    return OK(studanteRemoveTask.value);
  };

  uncomplete = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const { taskId } = request.body as TaskUncompleteRequestBody;
      if (!taskId) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const taskIdOrError = ID.parse(taskId);

      const registerId = request.user.data.id;

      if (taskIdOrError && taskIdOrError.isLeft()) {
        return BadRequest(taskIdOrError.value);
      }

      const uncompleteTask = await this.useCases.uncompleteTaskUseCase.execute({
        taskId: taskIdOrError.value,
        requesterId: registerId,
      });

      if (uncompleteTask.isLeft()) {
        return InternalServerError();
      }

      return OK(uncompleteTask.value);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  complete = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const payload = request.body as TaskCompleteRequestBody;
      if (!payload) {
        return BadRequest(new MissingRequiredParamsError());
      }
      const { elapsedTimeInSeconds, taskId } = payload;
      const registerId = request.user.data.id;

      if (!taskId) {
        return BadRequest(new MissingRequiredParamsError());
      }
      const taskIdOrError = ID.parse(taskId);

      if (taskIdOrError && taskIdOrError.isLeft()) {
        return BadRequest(taskIdOrError.value);
      }

      const elapsedTimeOrError =
        elapsedTimeInSeconds !== undefined
          ? ElapsedTimeInSeconds.create(elapsedTimeInSeconds)
          : undefined;
      if (elapsedTimeOrError && elapsedTimeOrError.isLeft()) {
        return BadRequest(elapsedTimeOrError.value);
      }

      const parsedTaskId = taskIdOrError.value;
      const parsedElapsedTime = elapsedTimeOrError
        ? elapsedTimeOrError.value
        : undefined;

      const completeTask = await this.useCases.completeTaskUseCase.execute({
        requesterId: registerId,
        taskId: parsedTaskId,
        elapsedTimeInSeconds: parsedElapsedTime,
      });

      if (completeTask.isLeft()) {
        return InternalServerError();
      }

      return OK(completeTask.value);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  updateElapsedTime = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const registerId = request.user.data.id;
      const elapsedTimeData = request.body as TaskElapsedTimeRequestBody;
      if (!elapsedTimeData.taskId || !elapsedTimeData.elapsedTimeInSeconds) {
        return BadRequest(new MissingRequiredParamsError());
      }
      const taskIdOrError = ID.parse(elapsedTimeData.taskId);

      const elapsedTimeOrError = ElapsedTimeInSeconds.create(
        elapsedTimeData.elapsedTimeInSeconds,
      );

      if (taskIdOrError && taskIdOrError.isLeft()) {
        return BadRequest(taskIdOrError.value);
      }
      if (elapsedTimeOrError && elapsedTimeOrError.isLeft()) {
        return BadRequest(elapsedTimeOrError.value);
      }

      const taskId = taskIdOrError.value;
      const elapsedTimeInSeconds = elapsedTimeOrError.value;

      const elapsedTime = await this.useCases.elapsedTimeUseCase.execute({
        requesterId: registerId,
        taskId: taskId,
        elapsedTime: elapsedTimeInSeconds,
      });

      if (elapsedTime.isLeft()) {
        return InternalServerError();
      }

      return OK(elapsedTime.value);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  getScheduledTask = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      const scheduledTasksQuery = request.query as GetScheduledTaskRequestBody;

      if (!scheduledTasksQuery.startDate || !scheduledTasksQuery.endDate) {
        return BadRequest(new Error('Missing required parameters.'));
      }

      const startDateOrError = CalendarDate.fromString(
        scheduledTasksQuery.startDate,
      );

      const endDateOrError = CalendarDate.fromString(
        scheduledTasksQuery.endDate,
      );

      if (startDateOrError && startDateOrError.isLeft()) {
        return BadRequest(startDateOrError.value);
      }

      if (endDateOrError && endDateOrError.isLeft()) {
        return BadRequest(endDateOrError.value);
      }

      const [startDate, endDate] = [
        startDateOrError.value,
        endDateOrError.value,
      ];
      const dateRangeOrError = DateRange.create({
        start: startDate,
        end: endDate,
      });

      if (dateRangeOrError && dateRangeOrError.isLeft()) {
        return BadRequest(dateRangeOrError.value);
      }

      const taskQuery = new TaskQuery();
      const dateRange = dateRangeOrError.value;

      const tasksTimelineForAllCourses = [];

      // Iterate over all courses
      for (const course of user.data.courses) {
        const { id: courseId } = course;

        const courseRepository = new MongooseCourseRepository();
        const courseData = await courseRepository.ofId(courseId);
        const courseName = courseData?.data.name || 'Unknown Course';

        const tasks = await taskQuery.ofUser(user.data.id);

        const userSubjectsEnhancedOrError = await getUserScheduleEnhanced(
          user.data.id,
          courseId,
        );

        if (userSubjectsEnhancedOrError.isLeft()) {
          continue;
        }

        const flatLessons = userSubjectsEnhancedOrError.value.subjects.reduce(
          (acc1, subject) => {
            if (subject.topics.length > 0) {
              const topics = subject.topics.reduce(
                (acc2, topic) => {
                  acc2.push([
                    topic.topicId,
                    {
                      title: topic.name,
                      subtitle: subject.name,
                      relevance: subject.relevance,
                    },
                  ]);
                  return acc2;
                },
                [] as [
                  string,
                  { title: string; subtitle: string; relevance: number },
                ][],
              );
              acc1.push(...topics);
            }
            return acc1;
          },
          [] as [
            string,
            { title: string; subtitle: string; relevance: number },
          ][],
        );

        const lessonsMap = new Map(flatLessons);

        const tasksTimeline = this.useCases.getTasksTimelineUseCase.execute({
          requesterId: user.data.id,
          preferredStartDate: user.data.preferedStartDate,
          dateRange: dateRange,
          userStudyAvailability: user.data.studyAvailability,
          courseSchedule: userSubjectsEnhancedOrError.value,
          tasks,
        });

        if (tasksTimeline.isLeft()) {
          return InternalServerError(tasksTimeline.value);
        }

        tasksTimelineForAllCourses.push({
          courseId,
          courseName, // Incluindo o nome do curso na resposta
          tasks: tasksTimeline.value.tasks.map((t) =>
            TimelineTasksDto.fromDomain(t, lessonsMap),
          ),
        });
      }

      return OK(tasksTimelineForAllCourses);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  createExtraTask = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const data = request.body as CreateExtraTaskRequestBody;

      const registerId = request.user.data.id;
      const user = request.user.data;

      if (!registerId || !data.topicId || !data.date || !data.type) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const courseIdOrError = ID.parse(data.courseId);

      if (courseIdOrError.isLeft()) {
        return BadRequest(courseIdOrError.value);
      }

      const dateOrError = CalendarDate.fromString(data.date);
      const topicIdOrError = ID.parse(data.topicId);

      const typeOrError = data.type as TaskType;

      if (dateOrError && dateOrError.isLeft()) {
        return BadRequest(dateOrError.value);
      }

      if (topicIdOrError.isLeft()) {
        return BadRequest(topicIdOrError.value);
      }

      if (!['study', 'lawStudy', 'exercise', 'review'].includes(typeOrError)) {
        return BadRequest(new Error('Invalid task type'));
      }

      const topicId = topicIdOrError;
      const date = dateOrError;
      const type = typeOrError;

      const createTaskResult =
        await this.useCases.createExtraTaskUseCase.execute({
          requesterId: ID.create(registerId.value),
          topicId: topicId.value,
          courseId: courseIdOrError.value,
          date: date.value,
          type: type,
        });

      const userSubjectsEnhancedOrError = await getUserScheduleEnhanced(
        user.id,
        courseIdOrError.value,
      );

      if (userSubjectsEnhancedOrError.isLeft()) {
        return BadRequest(userSubjectsEnhancedOrError.value);
      }

      if (createTaskResult.isLeft()) {
        return InternalServerError();
      }

      const flatLessons = userSubjectsEnhancedOrError.value.subjects.reduce(
        (acc1, subject) => {
          if (subject.topics.length > 0) {
            const topics = subject.topics.reduce(
              (acc2, topic) => {
                acc2.push([
                  topic.topicId,
                  {
                    title: topic.name,
                    subtitle: subject.name,
                    relevance: subject.relevance,
                  },
                ]);
                return acc2;
              },
              [] as [
                string,
                { title: string; subtitle: string; relevance: number },
              ][],
            );
            acc1.push(...topics);
          }
          return acc1;
        },
        [] as [
          string,
          { title: string; subtitle: string; relevance: number },
        ][],
      );

      const lessonsMap = new Map(flatLessons);

      return OK(
        TimelineTasksDto.fromDomain(
          {
            cycle: createTaskResult.value.data.cycle,
            estimatedTimeToComplete:
              createTaskResult.value.data.estimatedTimeToComplete,
            finished: createTaskResult.value.data.finished,
            id: createTaskResult.value.data.id,
            isExtra: createTaskResult.value.data.isExtra,
            ownerId: createTaskResult.value.data.ownerId,
            plannedDate:
              createTaskResult.value.data.plannedDate ?? CalendarDate.today(),
            topicId: createTaskResult.value.data.topicId,
            type: createTaskResult.value.data.type,
            completedOn: createTaskResult.value.data.completedOn,
            elapsedTimeInSeconds:
              createTaskResult.value.data.elapsedTimeInSeconds,
            courseId: createTaskResult.value.data.courseId,
          },
          lessonsMap,
        ),
      );
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  getTaskOrderOverview = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const requesterId = request.user;
      const requestedId = (request.params as { userId?: string })?.userId;
      const finishedFilter = request.query as { finished?: string } | undefined;
      const finishedValue = finishedFilter?.finished
        ? finishedFilter.finished === 'true'
        : undefined;

      if (!requestedId) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const parsedRequestedIdOrError = ID.parse(requestedId);

      if (parsedRequestedIdOrError.isLeft()) {
        return BadRequest(parsedRequestedIdOrError.value);
      }

      if (!requesterId.isAdmin()) {
        return Unauthorized();
      }

      const requestedUser = await new MongooseUserRepository().ofId(
        parsedRequestedIdOrError.value,
      );

      if (requestedUser === null) {
        return NotFound(new Error('Requested user not found'));
      }

      const taskQuery = new TaskQuery();

      const tasks = await taskQuery.ofUser(requestedUser?.data.id);

      const userSubjectsEnhancedOrError = await getUserScheduleEnhanced(
        requestedUser.data.id,
        requestedUser.data.courses[0].id,
      );

      if (userSubjectsEnhancedOrError.isLeft()) {
        return BadRequest(userSubjectsEnhancedOrError.value);
      }

      const flatLessons = userSubjectsEnhancedOrError.value.subjects.reduce(
        (acc1, subject) => {
          if (subject.topics.length > 0) {
            const topics = subject.topics.reduce(
              (acc2, topic) => {
                acc2.push([
                  topic.topicId,
                  {
                    title: topic.name,
                    subtitle: subject.name,
                    relevance: subject.relevance,
                  },
                ]);
                return acc2;
              },
              [] as [
                string,
                { title: string; subtitle: string; relevance: number },
              ][],
            );
            acc1.push(...topics);
          }
          return acc1;
        },
        [] as [
          string,
          { title: string; subtitle: string; relevance: number },
        ][],
      );
      const lessonsMap = new Map(flatLessons);

      const taskOrderingService = new TaskOrderingService(
        tasks,
        userSubjectsEnhancedOrError.value,
      );

      return OK(
        taskOrderingService
          .orderedTasks()
          .map((t) => ({
            task: {
              id: t.task.data.id.value,
              ownerId: t.task.data.ownerId.value,
              topicId: t.task.data.topicId.value,
              cycle: t.task.data.cycle,
              completedOn: t.task.data.completedOn?.value,
              plannedDate: t.task.data.plannedDate?.value,
              elapsedTimeInSeconds: t.task.data.elapsedTimeInSeconds?.value,
              finished: t.task.data.finished,
              type: t.task.data.type,
              estimatedTimeToComplete:
                t.task.data.estimatedTimeToComplete.minutes,
              isExtra: t.task.data.isExtra,
            },
            title: lessonsMap.get(t.task.data.topicId.value)?.title,
            subtitle: lessonsMap.get(t.task.data.topicId.value)?.subtitle,
            relevance: t.finalRelevance,
            topicRelevance: t.topicRelevance,
            performanceFactor: t.performanceFactor,
            daysLateFactor: t.daysLateFactor,
          }))
          .filter((t) =>
            finishedValue !== undefined
              ? t.task.finished === finishedValue
              : true,
          ),
      );
    } catch (error) {
      return InternalServerError();
    }
  };
}
