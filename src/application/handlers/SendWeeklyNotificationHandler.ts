import schedule from 'node-schedule';
import nodemailer, { Transporter } from 'nodemailer';
import { UserRepository } from '../../domain/user/UserRepository.js';
import { PerformanceRepository } from '../../infrastructure/database/mongoose/PerformanceRepository.js';
import { PerformanceEmblems } from '../performance/emblems/PerformanceEmblems.js';
import { Task } from '../performance/GetPerformanceUseCase.js';
import { MongooseUserDailyProgress } from '../../infrastructure/database/mongoose/MongooseUserDailyProgressDAO.js';
import { emailMensage } from './mensage.js';
import Twilio from 'twilio';

interface userData {
  name: string;
  email: string;
  percentageCompleted: number;
  weeksCompleted: number;
  totalStudyHours: number;
  consecutiveDays: number;
  emblems: {
    userLevel: string;
    userFrequency: string;
    userDedication: string;
  };
  questionsPerformance: number;
  averageTimePerDay: string;
  phone: string;
}

export class EmailScheduler {
  private transporter: Transporter;
  private scheduleTime: Date;
  private twilioClient: Twilio.Twilio;

  constructor(private readonly userRepository: UserRepository) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASS,
      },
    });

    const accountSid = process.env.ACCOUNT_SID;
    const authToken = process.env.AUTH_TOKEN;
    if (!accountSid || !authToken) {
      throw new Error(
        'Twilio account SID and auth token must be defined in environment variables.',
      );
    }

    this.twilioClient = Twilio(accountSid, authToken);
  }

  private async sendWhatsApp(user: userData): Promise<void> {
    try {
      const message = await this.twilioClient.messages.create({
        from: `whatsapp:${process.env.NUMBER}`,
        to: `whatsapp:+55${user.phone}`,
        contentSid: process.env.CONTENT_SID,
        contentVariables: JSON.stringify({
          1: user.name,
          2: user.emblems.userLevel,
          3: user.emblems.userFrequency,
          4: user.emblems.userDedication,
          5: '_Informação indisponível_',
          6: '0',
          7: user.consecutiveDays.toString(),
          8: user.weeksCompleted.toString(),
          9: user.totalStudyHours.toFixed(2),
          10: 'Seu tempo semanal está muito baixo',
          11: user.averageTimePerDay,
          12: (user.questionsPerformance * 100).toFixed(2),
          13: user.percentageCompleted.toFixed(2),
        }),
      });

      console.log(`Mensagem enviada com sucesso! SID: ${message.sid}`);
    } catch (error) {
      console.error('Erro ao enviar mensagem pelo WhatsApp:', error);
    }
  }

  private async sendEmail(user: userData): Promise<void> {
    const emailHTML = emailMensage(user);
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL,
        to: user.email,
        subject: 'Relatório de Desempenho',
        html: emailHTML,
      });
      console.log(`Email enviado para ${user.email}`);
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  }

  public async setupScheduler(): Promise<void> {
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
            new Date(a.completedOn!).getTime() -
            new Date(b.completedOn!).getTime(),
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

    const users = (await this.userRepository.listStudents()).filter(
      (user) => String(user.data.role?.value) === 'student',
    );
    const usersPerformance = new PerformanceRepository();

    const userDailyProgressDAO = new MongooseUserDailyProgress();
    const usersProgressAggregated =
      await userDailyProgressDAO.aggregatePerUser(365);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];

      const frequency = user.data.frequencySendPerformanceReport;

      if (frequency === 'never') {
        continue;
      }

      const userPerformance = await usersPerformance.findInformationByUser(
        user.data.id,
      );

      if (!userPerformance.userInfo) {
        throw new Error('User information is missing.');
      }

      const tasksCompleted = userPerformance.tasksPerUser.filter(
        (task) => task.finished,
      );
      const totalTasks = userPerformance.tasksPerUser.length;
      const percentageCompleted = (tasksCompleted.length / totalTasks) * 100;

      const consecutiveDays = calculateLastConsecutiveDays(
        userPerformance.tasksPerUser,
        userPerformance.userInfo.studyAvailability,
      );

      const weeksCompleted = Math.floor(consecutiveDays / 7);

      const totalElapsedTimeInSeconds: number = tasksCompleted.reduce(
        (total, task) => total + (task.elapsedTimeInSeconds || 0),
        0,
      );

      const totalStudyHours = totalElapsedTimeInSeconds / 3600;

      const performanceEmblems = new PerformanceEmblems();

      const userLevel = performanceEmblems.level(consecutiveDays);
      const userFrequency = performanceEmblems.frequency(
        userPerformance.tasksPerUser,
      );
      const userDedication = performanceEmblems.dedication(
        userPerformance.tasksPerUser,
      );

      const userProgress = usersProgressAggregated.find(
        (uP) => uP._id === user.data.id.value,
      );

      let questionsPerformance = 0;

      if (userProgress) {
        const totalQuestions = userProgress.performances.reduce(
          (acc, curr) => {
            acc.correctAmount += curr.correctAmount;
            acc.incorrectAmount += curr.incorrectAmount;
            return acc;
          },
          { correctAmount: 0, incorrectAmount: 0 },
        );

        const questionsAmount =
          totalQuestions.correctAmount + totalQuestions.incorrectAmount;

        questionsPerformance =
          questionsAmount === 0
            ? 0
            : totalQuestions.correctAmount / questionsAmount;
      }

      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const totalTimeInMinutes = userPerformance.tasksPerUser
        .filter(
          (task) =>
            task.finished &&
            task.completedOn &&
            new Date(task.completedOn) >= startOfWeek,
        )
        .reduce(
          (total, task) => total + (task.elapsedTimeInSeconds || 0) / 60,
          0,
        );

      const averageTimePerDay = totalTimeInMinutes / 7;

      const hours = Math.floor(averageTimePerDay / 60);
      const minutes = Math.round(averageTimePerDay % 60);
      const formattedAverageTimePerDay = `${hours}h${minutes.toString().padStart(2, '0')}m`;

      const userData = {
        name: String(user.data.name.value),
        email: String(user.data.email.value),
        phone: String(user.data.phone),
        percentageCompleted: percentageCompleted,
        weeksCompleted: weeksCompleted,
        totalStudyHours: totalStudyHours,
        consecutiveDays: consecutiveDays,
        emblems: {
          userLevel: userLevel,
          userFrequency: userFrequency,
          userDedication: userDedication,
        },
        questionsPerformance,
        averageTimePerDay: formattedAverageTimePerDay,
      };

      let cronExpression: string;

      if (frequency === 'weekly') {
        cronExpression = '0 9 * * 0';
      } else if (frequency === 'monthly' || !frequency) {
        cronExpression = '0 9 1 * *';
      } else {
        continue;
      }

      schedule.scheduleJob(cronExpression, async () => {
        await this.sendEmail(userData);
        if (user.data.phone !== undefined) await this.sendWhatsApp(userData);
      });
    }
  }
}
