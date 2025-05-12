import { FastifyRequest } from 'fastify';
import {
  HttpResponse,
  InternalServerError,
  OK,
} from '../../utils/responseHelpers.js';
import { PerformanceRepository } from '../../../database/mongoose/PerformanceRepository.js';
import { GetPerformanceUseCase } from '../../../../application/performance/GetPerformanceUseCase.js';

// type PerformanceControllerUseCases = {
//   getPerformanceUseCase: GetPerformanceUseCase;
// };

export class PerformanceController {
  // constructor(private readonly useCases: PerformanceControllerUseCases) {}

  getPerformanceSumary = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const user = request.user;

      const performanceRepository = new PerformanceRepository();

      const userInfoTasksById =
        await performanceRepository.findInformationByUser(user.data.id);

      const getPerformanceUseCase = new GetPerformanceUseCase();

      const performanceByUser =
        userInfoTasksById.tasksPerUser &&
        userInfoTasksById.userInfo &&
        getPerformanceUseCase.execute({
          userInfo: userInfoTasksById.userInfo,
          tasksPerUser: userInfoTasksById.tasksPerUser,
        });

      return OK(performanceByUser);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  getPerformanceStatistic = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const user = request.user;
      const performanceRepository = new PerformanceRepository();
      const userInfoTasksById =
        await performanceRepository.findInformationByUser(user.data.id);

      // Filtrar tarefas concluídas na semana atual
      const now = new Date();
      const startOfWeek = new Date(
        now.setDate(now.getDate() - now.getDay()),
      ).setHours(0, 0, 0, 0);
      const finishedTasksThisWeek = userInfoTasksById.tasksPerUser.filter(
        (task) =>
          task.finished &&
          task.completedOn &&
          new Date(task.completedOn) >= new Date(startOfWeek),
      );

      const totalTimeInMinutesPerDay = {
        sunday: 0,
        monday: 0,
        tuesday: 0,
        wednesday: 0,
        thursday: 0,
        friday: 0,
        saturday: 0,
      };
      finishedTasksThisWeek.forEach((task) => {
        if (task.completedOn) {
          const dayOfWeek = new Date(task.completedOn).getDay();
          const dayKeys = [
            'sunday',
            'monday',
            'tuesday',
            'wednesday',
            'thursday',
            'friday',
            'saturday',
          ];
          const dayKey = dayKeys[
            dayOfWeek
          ] as keyof typeof totalTimeInMinutesPerDay;
          totalTimeInMinutesPerDay[dayKey] +=
            (task.elapsedTimeInSeconds || 0) / 60;
        }
      });

      const totalTimeInMinutes = Object.values(totalTimeInMinutesPerDay).reduce(
        (total, time) => total + time,
        0,
      );
      const averageTimePerDay = totalTimeInMinutes / 7;

      const topicIds = finishedTasksThisWeek.map((task) => task.topicId);
      const topicInfo = await performanceRepository.topicsOfIds(topicIds);
      const topicCounts: Record<string, number> = {};

      finishedTasksThisWeek.forEach((task) => {
        const topic = topicInfo.find((t) => t.id === task.topicId);
        if (topic) {
          const topicName = topic.name;
          topicCounts[topicName] = (topicCounts[topicName] || 0) + 1;
        }
      });

      const topicsData = Object.keys(topicCounts).map((topicName) => ({
        topic: topicName,
        percentageCompleted:
          (topicCounts[topicName] / finishedTasksThisWeek.length) * 100,
      }));

      const plannedTasksToday = userInfoTasksById.tasksPerUser.filter(
        (task) =>
          task.plannedDate &&
          task.plannedDate === new Date().toISOString().split('T')[0],
      );

      return OK({
        studyAvailability: totalTimeInMinutesPerDay,
        averageTimePerDay,
        topicsData,
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };
}
