import { FastifyRequest } from 'fastify';
import {
  InternalServerError,
  OK,
  HttpResponse,
  Forbidden,
  BadRequest,
  NotFound,
} from '../../utils/responseHelpers.js';
import { MissingRequiredParamsError } from '../../../../errors/MissingRequiredParamsError.js';
import { MongooseUserDailyProgress } from '../../../database/mongoose/MongooseUserDailyProgressDAO.js';
import { CourseQuery } from '../../../../domain/course/CourseQuery.js';
import { ID } from '../../../../domain/Id.js';
import { UserRepository } from '../../../../domain/user/UserRepository.js';
import { DateRange } from '../../../../domain/DateRange.js';
import { CalendarDate } from '../../../../domain/CalendarDate.js';
import { UserDailyProgressDB } from '../../../database/mongoose/models/UserDailyProgressModel.js';

function safeDivide(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

function filterDocumentsByPastNDays(
  documents: UserDailyProgressDB[],
  n: number,
) {
  const dateRange = DateRange.create({
    start: CalendarDate.today().addDays(-n),
    end: CalendarDate.today(),
  }).value as DateRange;
  return documents.filter(function (uP) {
    const date = CalendarDate.fromString(uP.date).value as CalendarDate;
    return dateRange.contains(date);
  });
}

function filterDocumentsOfPreviousMonth(
  documents: UserDailyProgressDB[],
  n: number,
) {
  const dateRange = DateRange.create({
    start: CalendarDate.today().addDays(-30 * n),
    end: CalendarDate.today().addDays(-30 * n + 30),
  }).value as DateRange;
  return documents.filter(function (uP) {
    const date = CalendarDate.fromString(uP.date).value as CalendarDate;
    return dateRange.contains(date);
  });
}

export class AnalyticsController {
  constructor(
    private readonly userDailyProgressDAO: MongooseUserDailyProgress,
    private readonly courseQuery: CourseQuery,
    private readonly userRepository: UserRepository,
  ) {}
  coachDashboardUserGeneralInfo = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      if (!request.user.isAdmin()) {
        return Forbidden();
      }
      const params = request.params as { id?: string };
      const rawRequestedUserId = params.id;

      if (!rawRequestedUserId) {
        return BadRequest(new MissingRequiredParamsError());
      }
      const requestedUserIdOrError = ID.parse(rawRequestedUserId);

      if (requestedUserIdOrError.isLeft()) {
        return BadRequest(requestedUserIdOrError.value);
      }

      const user = await this.userRepository.ofId(requestedUserIdOrError.value);
      if (!user) {
        return NotFound(new Error('User not found'));
      }

      const userCourses = user.data.courses;

      const userProgressByDate = await this.userDailyProgressDAO.findByUserId(
        requestedUserIdOrError.value,
      );

      const studiedTopics = userProgressByDate.flatMap(
        (progress) => progress.subjectsStudied,
      );

      const result = {} as Record<
        string,
        {
          id: string;
          expectedWeeklyWorkload: number;
          weeklyDaysAvailability: number;
          registrationDate: string;
          expirationDate: string;
          progress: {
            completed: number;
            review: number;
            theoreticalStudy: number;
          };
          performance: Record<
            string,
            {
              competitors: number;
              user: number;
            }
          >;
        }
      >;

      const courseNames = await this.courseQuery.listNames();
      const coursesNameMap = new Map(courseNames.map((c) => [c.id, c.name]));

      for (const course of userCourses) {
        const courseId = course.id;
        const courseData = await this.courseQuery.subjects(courseId);
        if (!courseData) {
          return NotFound(new Error('Course not found'));
        }
        const courseTopics = courseData.flatMap((subject) =>
          subject.topics.map((t) => t.id),
        );
        const studiedTopicsOfCourse = studiedTopics.filter((topic) =>
          courseTopics.includes(topic),
        );
        const totalTopics = courseTopics.length;
        const totalStudiedTopics = studiedTopicsOfCourse.length;
        const courseProgress = totalStudiedTopics / totalTopics;
        const studiedTopicsLength = studiedTopicsOfCourse.length;
        const reviewedTopics = courseTopics.length - studiedTopicsLength;

        const yearTimeSpansForGraphic = Array.from({ length: 12 }, (_, i) => {
          const start = new Date(new Date().getFullYear(), i, 1);
          const end = new Date(new Date().getFullYear(), i + 1, 0);
          return {
            month: i + 1,
            span: {
              start: `${start.getFullYear()}-${start.getMonth() + 1}-${start.getDate()}`,
              end: `${end.getFullYear()}-${end.getMonth() + 1}-${end.getDate()}`,
            },
            label: `${start.getFullYear()}-${start.getMonth() + 1}`,
          };
        });

        const graphicList = yearTimeSpansForGraphic.map((span) => {
          const studiedTopicsOfCourseInSpan = userProgressByDate.filter(
            (uP) => {
              const date = new Date(uP.date);
              return (
                date >= new Date(span.span.start) &&
                date <= new Date(span.span.end)
              );
            },
          );
          const studiedTopicsFilteredOfCourse = studiedTopicsOfCourseInSpan
            .flatMap((doc) => doc.subjectsStudied)
            .filter((topic) => courseTopics.includes(topic));
          return {
            ...span,
            userProgress: studiedTopicsFilteredOfCourse.length / totalTopics,
          };
        });
        result[coursesNameMap.get(courseId.value) ?? courseId.value] = {
          id: courseId.value,
          expectedWeeklyWorkload:
            Array.from(user.data.studyAvailability.value.values()).reduce(
              (acc, curr) => acc + curr.minutes,
              0,
            ) / 60,
          weeklyDaysAvailability: Array.from(
            user.data.studyAvailability.value.values(),
          ).filter((day) => day.minutes > 0).length,
          registrationDate: course.registrationDate.value,
          expirationDate: course.expirationDate.value,
          progress: {
            completed: courseProgress,
            review: reviewedTopics,
            theoreticalStudy: studiedTopicsLength,
          },
          performance: graphicList.reduce(
            (acc, curr) => {
              acc[curr.label] = {
                competitors: 0.5,
                user: curr.userProgress,
              };
              return acc;
            },
            {} as Record<string, { competitors: number; user: number }>,
          ),
        };
      }
      return OK({
        name: user.data.name.value,
        email: user.data.email.value,
        phone: user.data.phone?.value,
        courses: result,
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  coachDashboardUserFrequency = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      if (!request.user.isAdmin()) {
        return Forbidden();
      }
      const params = request.params as { id?: string };
      const rawRequestedUserId = params.id;

      if (!rawRequestedUserId) {
        return BadRequest(new MissingRequiredParamsError());
      }
      const requestedUserIdOrError = ID.parse(rawRequestedUserId);

      if (requestedUserIdOrError.isLeft()) {
        return BadRequest(requestedUserIdOrError.value);
      }

      const user = await this.userRepository.ofId(requestedUserIdOrError.value);
      if (!user) {
        return NotFound(new Error('User not found'));
      }

      const userCourses = user.data.courses;

      const courseNames = await this.courseQuery.listNames();
      const coursesNameMap = new Map(courseNames.map((c) => [c.id, c.name]));

      const userProgressByDate = await this.userDailyProgressDAO.findByUserId(
        requestedUserIdOrError.value,
      );

      const allUsersProgressByDate = await this.userDailyProgressDAO.getAll();

      const usersProgressAggregated = allUsersProgressByDate.reduce(
        (acc, curr) => {
          const userProgress = acc.get(curr.userId);
          if (userProgress) {
            userProgress.push(curr);
          } else {
            acc.set(curr.userId, [curr]);
          }
          return acc;
        },
        new Map<string, typeof allUsersProgressByDate>(),
      );

      const result = {} as Record<
        string,
        {
          '30 dias': {
            expectedAccesses: number;
            accesses: number;
            expectedWorkload: number;
            completedWorkload: number;
            expectedTasks: number;
            completedTasks: number;
            averageFrequency: number;
          };
          '60 dias': {
            expectedAccesses: number;
            accesses: number;
            expectedWorkload: number;
            completedWorkload: number;
            expectedTasks: number;
            completedTasks: number;
            averageFrequency: number;
          };
          '90 dias': {
            expectedAccesses: number;
            accesses: number;
            expectedWorkload: number;
            completedWorkload: number;
            expectedTasks: number;
            completedTasks: number;
            averageFrequency: number;
          };
          performance: Record<
            string,
            {
              competitors: number;
              user: number;
            }
          >;
        }
      >;

      const expectedWeeklyAccesses = Array.from(
        user.data.studyAvailability.value.values(),
      ).filter((day) => day.minutes > 0).length;

      const expectedWeeklyWorkload = Array.from(
        user.data.studyAvailability.value.values(),
      ).reduce((acc, curr) => acc + curr.minutes, 0);

      const dateRange30 = DateRange.create({
        start: CalendarDate.today().addDays(-30),
        end: CalendarDate.today(),
      }).value as DateRange;

      const dateRange60 = DateRange.create({
        start: CalendarDate.today().addDays(-60),
        end: CalendarDate.today(),
      }).value as DateRange;

      const dateRange90 = DateRange.create({
        start: CalendarDate.today().addDays(-90),
        end: CalendarDate.today(),
      }).value as DateRange;

      const userAccesses = Array.from(usersProgressAggregated.entries()).map(
        ([userId, userProgress]) => {
          return {
            userId,
            accesses30: filterDocumentsByPastNDays(userProgress, 30).length,
            accesses60: filterDocumentsByPastNDays(userProgress, 60).length,
            accesses90: filterDocumentsByPastNDays(userProgress, 90).length,
            completedWorkload12: filterDocumentsOfPreviousMonth(
              userProgress,
              1,
            ).reduce((acc, curr) => acc + curr.aggregatedStudyTime, 0),
            completedWorkload11: filterDocumentsOfPreviousMonth(
              userProgress,
              2,
            ).reduce((acc, curr) => acc + curr.aggregatedStudyTime, 0),
            completedWorkload10: filterDocumentsOfPreviousMonth(
              userProgress,
              3,
            ).reduce((acc, curr) => acc + curr.aggregatedStudyTime, 0),
            completedWorkload9: filterDocumentsOfPreviousMonth(
              userProgress,
              4,
            ).reduce((acc, curr) => acc + curr.aggregatedStudyTime, 0),
            completedWorkload8: filterDocumentsOfPreviousMonth(
              userProgress,
              5,
            ).reduce((acc, curr) => acc + curr.aggregatedStudyTime, 0),
            completedWorkload7: filterDocumentsOfPreviousMonth(
              userProgress,
              6,
            ).reduce((acc, curr) => acc + curr.aggregatedStudyTime, 0),
            completedWorkload6: filterDocumentsOfPreviousMonth(
              userProgress,
              7,
            ).reduce((acc, curr) => acc + curr.aggregatedStudyTime, 0),
            completedWorkload5: filterDocumentsOfPreviousMonth(
              userProgress,
              8,
            ).reduce((acc, curr) => acc + curr.aggregatedStudyTime, 0),
            completedWorkload4: filterDocumentsOfPreviousMonth(
              userProgress,
              9,
            ).reduce((acc, curr) => acc + curr.aggregatedStudyTime, 0),
            completedWorkload3: filterDocumentsOfPreviousMonth(
              userProgress,
              10,
            ).reduce((acc, curr) => acc + curr.aggregatedStudyTime, 0),
            completedWorkload2: filterDocumentsOfPreviousMonth(
              userProgress,
              11,
            ).reduce((acc, curr) => acc + curr.aggregatedStudyTime, 0),
            completedWorkload1: filterDocumentsOfPreviousMonth(
              userProgress,
              12,
            ).reduce((acc, curr) => acc + curr.aggregatedStudyTime, 0),
          };
        },
      );

      const averageFrequency30 =
        userAccesses.reduce((acc, curr) => acc + curr.accesses30, 0) /
        userAccesses.length;

      const averageFrequency60 =
        userAccesses.reduce((acc, curr) => acc + curr.accesses60, 0) /
        userAccesses.length;

      const averageFrequency90 =
        userAccesses.reduce((acc, curr) => acc + curr.accesses90, 0) /
        userAccesses.length;

      const dailyProgress30 = userProgressByDate.filter(function (uP) {
        const date = CalendarDate.fromString(uP.date).value as CalendarDate;
        return dateRange30.contains(date);
      });

      const dailyProgress60 = userProgressByDate.filter(function (uP) {
        const date = CalendarDate.fromString(uP.date).value as CalendarDate;
        return dateRange60.contains(date);
      });

      const dailyProgress90 = userProgressByDate.filter(function (uP) {
        const date = CalendarDate.fromString(uP.date).value as CalendarDate;
        return dateRange90.contains(date);
      });

      const completedWorkload30 = dailyProgress30.reduce(
        (acc, curr) => acc + curr.aggregatedStudyTime,
        0,
      );

      const completedWorkload60 = dailyProgress60.reduce(
        (acc, curr) => acc + curr.aggregatedStudyTime,
        0,
      );

      const completedWorkload90 = dailyProgress90.reduce(
        (acc, curr) => acc + curr.aggregatedStudyTime,
        0,
      );

      const completedTasks30 = dailyProgress30.flatMap(
        (uP) => uP.completedTasks,
      ).length;

      const completedTasks60 = dailyProgress60.flatMap(
        (uP) => uP.completedTasks,
      ).length;

      const completedTasks90 = dailyProgress90.flatMap(
        (uP) => uP.completedTasks,
      ).length;

      const today = new Date();

      const yearMonths = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
        return `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      }).reduce(
        (acc, curr, i) => {
          acc[12 - i] = curr;
          return acc;
        },
        {} as Record<number, string>,
      );

      for (const course of userCourses) {
        const courseName = coursesNameMap.get(course.id.value);
        if (!courseName) {
          continue;
        }

        result[courseName] = {
          '30 dias': {
            expectedAccesses: expectedWeeklyAccesses * 4,
            accesses: dailyProgress30.length,
            expectedWorkload: (expectedWeeklyWorkload / 60) * 4,
            completedWorkload: completedWorkload30,
            expectedTasks: (expectedWeeklyWorkload * 4) / 90,
            completedTasks: completedTasks30,
            averageFrequency: safeDivide(
              dailyProgress30.length - averageFrequency30,
              averageFrequency30,
            ),
          },
          '60 dias': {
            expectedAccesses: expectedWeeklyAccesses * 8,
            accesses: dailyProgress60.length,
            expectedWorkload: (expectedWeeklyWorkload / 60) * 8,
            completedWorkload: completedWorkload60,
            expectedTasks: (expectedWeeklyWorkload * 8) / 90,
            completedTasks: completedTasks60,
            averageFrequency: safeDivide(
              dailyProgress60.length - averageFrequency60,
              averageFrequency60,
            ),
          },
          '90 dias': {
            expectedAccesses: expectedWeeklyAccesses * 12,
            accesses: dailyProgress90.length,
            expectedWorkload: (expectedWeeklyWorkload / 60) * 12,
            completedWorkload: completedWorkload90,
            expectedTasks: (expectedWeeklyWorkload * 12) / 90,
            completedTasks: completedTasks90,
            averageFrequency: safeDivide(
              dailyProgress90.length - averageFrequency90,
              averageFrequency90,
            ),
          },
          performance: {
            [yearMonths[1]]: {
              competitors: safeDivide(
                userAccesses.reduce(
                  (acc, curr) => acc + curr.completedWorkload1,
                  0,
                ),
                userAccesses.length,
              ),
              user:
                userAccesses.find((uA) => uA.userId === user.data.id.value)
                  ?.completedWorkload1 ?? 0,
            },
            [yearMonths[2]]: {
              competitors: safeDivide(
                userAccesses.reduce(
                  (acc, curr) => acc + curr.completedWorkload2,
                  0,
                ),
                userAccesses.length,
              ),
              user:
                userAccesses.find((uA) => uA.userId === user.data.id.value)
                  ?.completedWorkload2 ?? 0,
            },
            [yearMonths[3]]: {
              competitors: safeDivide(
                userAccesses.reduce(
                  (acc, curr) => acc + curr.completedWorkload3,
                  0,
                ),
                userAccesses.length,
              ),
              user:
                userAccesses.find((uA) => uA.userId === user.data.id.value)
                  ?.completedWorkload3 ?? 0,
            },
            [yearMonths[4]]: {
              competitors: safeDivide(
                userAccesses.reduce(
                  (acc, curr) => acc + curr.completedWorkload4,
                  0,
                ),
                userAccesses.length,
              ),
              user:
                userAccesses.find((uA) => uA.userId === user.data.id.value)
                  ?.completedWorkload4 ?? 0,
            },
            [yearMonths[5]]: {
              competitors: safeDivide(
                userAccesses.reduce(
                  (acc, curr) => acc + curr.completedWorkload5,
                  0,
                ),
                userAccesses.length,
              ),
              user:
                userAccesses.find((uA) => uA.userId === user.data.id.value)
                  ?.completedWorkload5 ?? 0,
            },
            [yearMonths[6]]: {
              competitors: safeDivide(
                userAccesses.reduce(
                  (acc, curr) => acc + curr.completedWorkload6,
                  0,
                ),
                userAccesses.length,
              ),
              user:
                userAccesses.find((uA) => uA.userId === user.data.id.value)
                  ?.completedWorkload6 ?? 0,
            },
            [yearMonths[7]]: {
              competitors: safeDivide(
                userAccesses.reduce(
                  (acc, curr) => acc + curr.completedWorkload7,
                  0,
                ),
                userAccesses.length,
              ),
              user:
                userAccesses.find((uA) => uA.userId === user.data.id.value)
                  ?.completedWorkload7 ?? 0,
            },
            [yearMonths[8]]: {
              competitors: safeDivide(
                userAccesses.reduce(
                  (acc, curr) => acc + curr.completedWorkload8,
                  0,
                ),
                userAccesses.length,
              ),
              user:
                userAccesses.find((uA) => uA.userId === user.data.id.value)
                  ?.completedWorkload8 ?? 0,
            },
            [yearMonths[9]]: {
              competitors: safeDivide(
                userAccesses.reduce(
                  (acc, curr) => acc + curr.completedWorkload9,
                  0,
                ),
                userAccesses.length,
              ),
              user:
                userAccesses.find((uA) => uA.userId === user.data.id.value)
                  ?.completedWorkload9 ?? 0,
            },
            [yearMonths[10]]: {
              competitors: safeDivide(
                userAccesses.reduce(
                  (acc, curr) => acc + curr.completedWorkload10,
                  0,
                ),
                userAccesses.length,
              ),
              user:
                userAccesses.find((uA) => uA.userId === user.data.id.value)
                  ?.completedWorkload10 ?? 0,
            },
            [yearMonths[11]]: {
              competitors: safeDivide(
                userAccesses.reduce(
                  (acc, curr) => acc + curr.completedWorkload11,
                  0,
                ),
                userAccesses.length,
              ),
              user:
                userAccesses.find((uA) => uA.userId === user.data.id.value)
                  ?.completedWorkload11 ?? 0,
            },
            [yearMonths[12]]: {
              competitors: safeDivide(
                userAccesses.reduce(
                  (acc, curr) => acc + curr.completedWorkload12,
                  0,
                ),
                userAccesses.length,
              ),
              user:
                userAccesses.find((uA) => uA.userId === user.data.id.value)
                  ?.completedWorkload12 ?? 0,
            },
          },
        };
      }

      return OK({
        name: user.data.name.value,
        email: user.data.email.value,
        phone: user.data.phone?.value,
        courses: result,
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };
  userProgress = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;

      const usersProgressAggregated =
        await this.userDailyProgressDAO.aggregatePerUser(365);
      const courseNamesList = await this.courseQuery.listNames();
      const courseNamesMap = new Map(
        courseNamesList.map((c) => [c.id, c.name]),
      );
      const userCourses = user.data.courses;
      const userProgress = usersProgressAggregated.find(
        (uP) => uP._id === user.data.id.value,
      );

      const result = {
        courses: [],
      } as {
        courses: {
          name: string;
          id: string;
          questionsAmount: number;
          questionsPerformance: number;
          competitorsPerformance: number;
        }[];
      };

      const resultByTopic = usersProgressAggregated.reduce(
        (acc, curr) => {
          const performances = curr.performances;
          for (const performance of performances) {
            const topicId = performance.topicId;
            const topic = acc[topicId] ?? {
              questionsAmount: 0,
              questionsPerformance: 0,
              count: 0,
            };
            topic.questionsAmount +=
              performance.correctAmount + performance.incorrectAmount;
            topic.questionsPerformance +=
              topic.questionsAmount === 0
                ? 0
                : performance.correctAmount / topic.questionsAmount;
            topic.count++;
            acc[topicId] = topic;
          }
          return acc;
        },
        {} as Record<
          string,
          {
            questionsAmount: number;
            questionsPerformance: number;
            count: number;
          }
        >,
      );

      for (const courseId of userCourses) {
        const courseName = courseNamesMap.get(courseId.id.value);
        if (!courseName) {
          continue;
        }

        const courseSubjects = await this.courseQuery.subjects(courseId.id);
        if (!courseSubjects) {
          continue;
        }

        const courseTopics = courseSubjects.flatMap((subject) =>
          subject.topics.map((t) => t.id),
        );

        const userProgressOfCourse = userProgress?.performances
          .filter((p) => courseTopics.includes(p.topicId))
          .reduce(
            (acc, curr) => {
              acc.correctAmount += curr.correctAmount;
              acc.incorrectAmount += curr.incorrectAmount;
              return acc;
            },
            { correctAmount: 0, incorrectAmount: 0 },
          );

        const competitorsProgressOfCourse = courseTopics.reduce(
          (acc, curr) => {
            const topicProgress = resultByTopic[curr];
            if (!topicProgress) {
              return acc;
            }
            acc.competitorsPerformanceSum += topicProgress.questionsPerformance;
            acc.competitorsPerformanceCount += topicProgress.count;
            return acc;
          },
          { competitorsPerformanceSum: 0, competitorsPerformanceCount: 0 },
        );

        const userProgressQuestionsAmount =
          (userProgressOfCourse?.correctAmount ?? 0) +
          (userProgressOfCourse?.incorrectAmount ?? 0);
        const userProgressPerformance =
          userProgressQuestionsAmount === 0
            ? 0
            : (userProgressOfCourse?.correctAmount ?? 0) /
              userProgressQuestionsAmount;

        result.courses.push({
          name: courseName,
          id: courseId.id.value,
          questionsAmount: userProgressQuestionsAmount,
          questionsPerformance: userProgressPerformance,
          competitorsPerformance:
            competitorsProgressOfCourse.competitorsPerformanceCount === 0
              ? 0
              : competitorsProgressOfCourse.competitorsPerformanceSum /
                competitorsProgressOfCourse.competitorsPerformanceCount,
        });
      }

      return OK(result);
    } catch (error) {
      console.error(error);
      return InternalServerError(error as Error);
    }
  };
}
