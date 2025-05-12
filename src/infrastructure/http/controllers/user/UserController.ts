/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyRequest, type FastifyReply } from 'fastify';
import { CalendarDate } from '../../../../domain/CalendarDate.js';
import { UserStudyAvailability } from '../../../../domain/user/UserStudyAvailability.js';
import {
  HttpResponse,
  BadRequest,
  InternalServerError,
  OK,
  Forbidden,
  NotFound,
} from '../../utils/responseHelpers.js';
import { Either, left, right } from '../../../../shared/utils/Either.js';
import { Weekday } from '../../../../domain/Weekday.js';
import { addDays, subDays, format } from 'date-fns';
import { TimespanInMinutes } from '../../../../domain/user/TimespanInMinutes.js';
import { InvalidMinutesAvailableError } from '../../../../errors/InvalidMinutesAvailableError.js';
import { InvalidWeekdayError } from '../../../../errors/InvalidWeekdayError.js';
import { CompleteOnboardingUseCase } from '../../../../application/user/CompleteOnboardingUseCase.js';
import { UpdatePreferredStartDateUseCase } from '../../../../application/user/UpdatePreferredStartDateUseCase.js';
import { UpdateStudyAvailabilityUseCase } from '../../../../application/user/UpdateStudyAvailabilityUseCase.js';
import { MissingRequiredParamsError } from '../../../../errors/MissingRequiredParamsError.js';
import { InvalidCalendarDate } from '../../../../errors/InvalidCalendarDate.js';
import { ID } from '../../../../domain/Id.js';
import { TaskType } from '../../../../domain/task/TaskType.js';
import { RegisterUserSubjectCustomizationsUseCase } from '../../../../application/user/RegisterUserSubjectCustomizationsUseCase.js';
import { Name } from '../../../../domain/user/Name.js';
import { UpdateUserInfoUseCase } from '../../../../application/user/UpdateUserInfoUseCase.js';
import { UserQuery } from '../../../database/mongoose/UserQuery.js';
import { UserNotFoundError } from '../../../../errors/UserNotFoundError.js';
import { MongooseCourseQuery } from '../../../database/mongoose/MongooseCourseQuery.js';
import { UserSubjectsStatusQuery } from '../../../database/mongoose/UserSubjectsStatusQuery.js';
import { Role } from '../../../../domain/user/Role.js';
import { UpdateUserRoleUseCase } from '../../../../application/user/UpdateUserRoleUseCase.js';
import { UploadProfileImageUseCase } from '../../../../application/user/CreateProfileImageUseCase.js';
import { FirebaseStorageService } from '../../../services/storage/FirebaseStorageService.js';
import fs from 'fs';
import { FileNotFoundError } from '../../../../errors/FileNotFoundError.js';
import sharp, { type Sharp } from 'sharp';
import { DeleteProfileImageUseCase } from '../../../../application/user/DeleteProfileImageUseCase.js';
import { GetUserDataUseCase } from '../../../../application/user/GetUserDataUseCase.js';
import { UpdateStudentInfoUseCase } from '../../../../application/user/UpdateStudentInfoUseCase.js';
import { Email } from '../../../../domain/user/Email.js';
import { Phone } from '../../../../domain/user/Phone.js';
import { UpdateUserCourseUseCase } from '../../../../application/user/UpdateUserCoursesUseCase.js';
import { DeleteUserUseCase } from '../../../../application/user/DeleteUserUseCase.js';
import type { GetUserCourseInformationUseCase } from '../../../../application/user/GetUserCourseInformartionUseCase.js';
import XLSX from 'xlsx';
import path from 'path';
import { unlink } from 'fs/promises';
import type { DailyPerformanceUseCase } from '../../../../application/user/DailyPerformanceUseCase.js';
import type { UpdateFrequencySendEmailReportUseCase } from '../../../../application/user/UpdateFrequencySendEmailReportUseCase.js';
import type { FetchAllSubjectsUseCase } from '../../../../application/user/FetchAllSubjectsUseCase.js';
import type { ReturnUserPerformanceUseCase } from '../../../../application/user/ReturnUserPerformanceUseCase.js';
import { FirebaseAuthService } from '../../../services/auth/FirebaseAuthService.js';
import type { RollbackUserUseCase } from '../../../../application/user/RollbackUserUseCase.js';
import type { GetAllStudentPerformanceUseCase } from '../../../../application/user/GetAllStudentPerformanceUseCase.js';

interface FastifyMulterRequest extends FastifyRequest {
  file: {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
  };
}

export type RegisterUserRequestBody = {
  preferedStartDate?: string;
  studyAvailability?: Record<string, number>;
  name?: string;
  courses?: string[];
  email?: string;
  cpf?: string;
  phone?: string;
};

type RegisterUserCustomizationsRequestBody = {
  userId?: string;
  courseId?: string;
  subjects?: {
    id?: string;
    active?: boolean;
    topics?: {
      id?: string;
      active?: boolean;
      taskTypes?: string[];
    }[];
  }[];
};

type UpdateUserInfoRequestPayload = {
  name?: string;
  age?: number;
  jobPosition?: string;
  phone?: string;
};

export type ParsedTopicFromRegisterUserCustomizationsRequestBody = {
  id: ID;
  active: boolean;
  taskTypes: TaskType[];
};

type ParsedSubjectFromRegisterUserCustomizationsRequestBody = {
  id: ID;
  active: boolean;
  topics: ParsedTopicFromRegisterUserCustomizationsRequestBody[];
};

type UserControllerUseCases = {
  completeOnboardingUseCase: CompleteOnboardingUseCase;
  setPreferredStartDate: UpdatePreferredStartDateUseCase;
  setUserStudyAvailability: UpdateStudyAvailabilityUseCase;
  registerUserCustomizationUseCase: RegisterUserSubjectCustomizationsUseCase;
  updateUserInfo: UpdateUserInfoUseCase;
  updateUserRoleUseCase: UpdateUserRoleUseCase;
  updateStudentInfoUseCase: UpdateStudentInfoUseCase;
  updateUserCourseUseCase: UpdateUserCourseUseCase;
  uploadProfileImageUseCase: UploadProfileImageUseCase;
  deleteProfileImageUseCase: DeleteProfileImageUseCase;
  getUserDataUseCase: GetUserDataUseCase;
  deleteUserUseCase: DeleteUserUseCase;
  getUserCourseInformationUseCase: GetUserCourseInformationUseCase;
  dailyPerformanceUseCase: DailyPerformanceUseCase;
  updateFrequencySendEmailReport: UpdateFrequencySendEmailReportUseCase;
  fetchAllSubjectsUseCase: FetchAllSubjectsUseCase;
  returnUserPerformanceUseCase: ReturnUserPerformanceUseCase;
  rollbackUserUseCase: RollbackUserUseCase;
  getAllStudentPerformanceUseCase: GetAllStudentPerformanceUseCase;
};

type course = {
  id: ID;
  registrationDate: CalendarDate;
  expirationDate: CalendarDate;
};

type UpdateStudentInfoData = {
  userId: ID;
  email?: Email;
  phone?: Phone;
  course?: course;
};

function parseSubjectsFromUpdateTaskTypesRequestBody(
  subjects: Required<RegisterUserCustomizationsRequestBody>['subjects'],
): Either<Error, ParsedSubjectFromRegisterUserCustomizationsRequestBody[]> {
  const validSubjects: ParsedSubjectFromRegisterUserCustomizationsRequestBody[] =
    [];

  for (const subject of subjects) {
    if (
      !subject.topics ||
      !subject.topics.length ||
      !subject.id ||
      subject.active === undefined
    ) {
      return left(new MissingRequiredParamsError());
    }
    const subjectIdOrError = ID.parse(subject.id);
    if (subjectIdOrError.isLeft()) {
      return left(subjectIdOrError.value);
    }

    const validTopics: ParsedTopicFromRegisterUserCustomizationsRequestBody[] =
      [];

    for (const topic of subject.topics) {
      if (!topic.taskTypes || topic.active === undefined || !topic.id) {
        return left(new MissingRequiredParamsError());
      }
      const topicIdOrError = ID.parse(topic.id);
      if (topicIdOrError.isLeft()) {
        return left(topicIdOrError.value);
      }
      if (topic.taskTypes.length !== 0) {
        const taskTypes: TaskType[] = [];
        for (const taskType of topic.taskTypes) {
          const taskTypeOrError = TaskType.create(taskType);
          if (taskTypeOrError.isLeft()) {
            return left(taskTypeOrError.value);
          }
          taskTypes.push(taskTypeOrError.value);
        }
        validTopics.push({
          id: topicIdOrError.value,
          active: topic.active,
          taskTypes,
        });
      } else {
        validTopics.push({
          id: topicIdOrError.value,
          active: topic.active,
          taskTypes: [],
        });
      }
    }
    validSubjects.push({
      id: subjectIdOrError.value,
      active: subject.active,
      topics: validTopics,
    });
  }

  return right(validSubjects);
}

export class UserController {
  constructor(private readonly useCases: UserControllerUseCases) {}

  private parseUserAvailability(
    rawAvailability: Record<string, number>,
  ): Either<
    InvalidMinutesAvailableError | InvalidWeekdayError,
    UserStudyAvailability
  > {
    const parsedUserStudyAvailability = new Map<Weekday, TimespanInMinutes>();
    for (const [weekDayString, availabilityValue] of Object.entries(
      rawAvailability,
    )) {
      const weekDayOrError = Weekday.fromString(weekDayString);
      const availabilityOrError = TimespanInMinutes.create(availabilityValue);

      if (weekDayOrError.isLeft()) {
        return left(weekDayOrError.value);
      }
      if (availabilityOrError.isLeft()) {
        return left(availabilityOrError.value);
      }

      parsedUserStudyAvailability.set(
        weekDayOrError.value,
        availabilityOrError.value,
      );
    }

    return right(UserStudyAvailability.create(parsedUserStudyAvailability));
  }

  private parsePreferredStartDate(
    rawDate: string,
  ): Either<InvalidCalendarDate, CalendarDate> {
    if (Number.isNaN(Date.parse(rawDate))) {
      return left(new InvalidCalendarDate(rawDate));
    }

    return right(CalendarDate.fromDate(new Date(rawDate)));
  }

  getUserPerformanceByUserId = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const { id } = request.params as { id: string };

    const userIdOrError = ID.parse(id);

    if (userIdOrError.isLeft()) {
      return reply.status(400).send({ error: userIdOrError.value.message });
    }

    const resultOrError =
      await this.useCases.returnUserPerformanceUseCase.execute(
        userIdOrError.value,
      );

    const allStudentPerformance =
      await this.useCases.getAllStudentPerformanceUseCase.execute(
        userIdOrError.value,
      );

    if (allStudentPerformance.isLeft()) {
      return reply.status(404).send(allStudentPerformance.value);
    }

    if (resultOrError.isLeft()) {
      return reply.status(404).send(resultOrError.value);
    }

    return reply.status(200).send({
      userPerformance: resultOrError.value,
      allStudentPerformance: allStudentPerformance.value,
    });
  };

  fetchAllSubjectByUserId = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const user = request.user;

    const fetchAllSubjectByUserIdOrError =
      await this.useCases.fetchAllSubjectsUseCase.execute(user);

    return reply
      .status(200)
      .send({ subjects: fetchAllSubjectByUserIdOrError.value });
  };

  updateFrequencySendEmailReport = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    const { frequency } = request.body as { frequency: string };

    const userId = request.user.data.id;

    if (!frequency) {
      return BadRequest(new MissingRequiredParamsError());
    }

    const resultOrError =
      await this.useCases.updateFrequencySendEmailReport.execute({
        frequency,
        userId,
      });

    if (resultOrError.isLeft()) {
      return InternalServerError(resultOrError.value);
    }

    return OK({
      isSuccess: true,
    });
  };

  completeOnboarding = async ({
    user,
  }: FastifyRequest): Promise<HttpResponse> => {
    try {
      const completeOnboardingOrError =
        await this.useCases.completeOnboardingUseCase.execute(user);
      if (completeOnboardingOrError.isLeft()) {
        return InternalServerError();
      }
      return OK(completeOnboardingOrError.value);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  exportOnboarding = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const user = request.user;

    if (!user.isAdmin()) {
      return Forbidden();
    }

    const userQuery = new UserQuery();
    const students = (await userQuery.listUsers()).filter(
      (student) => student.role === 'student',
    );

    const data = [
      ['Nome', 'Email', 'Telefone', 'CPF', 'Cargo'],
      ...students.map((student) => [
        student.name,
        student.email,
        student.phone ?? '',
        student.cpf ?? '',
        student.jobPosition ?? '',
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alunos');
    worksheet['!cols'] = [
      { width: 40 },
      { width: 40 },
      { width: 20 },
      { width: 20 },
      { width: 25 },
    ];
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const filePath = path.join(tempDir, 'onboarding.xlsx');

    try {
      XLSX.writeFile(workbook, filePath, { type: 'file' });

      const fileStream = fs.createReadStream(filePath);

      fileStream.on('close', () => {
        // Deleta o arquivo após o envio ser concluído
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      return reply
        .header(
          'Content-Type',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        )
        .header('Content-Disposition', 'attachment; filename=onboarding.xlsx')
        .send(fileStream);
    } catch (error) {
      console.error('Erro ao gerar o arquivo:', error);
      return reply
        .status(500)
        .send({ error: 'Erro ao gerar ou enviar o arquivo' });
    }
  };

  setPreferredStartDate = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const user = request.user;
      const payload = request.body as
        | {
            preferredStartDate?: string;
          }
        | undefined;
      if (!payload?.preferredStartDate) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const dateOrError = this.parsePreferredStartDate(
        payload.preferredStartDate,
      );
      if (dateOrError.isLeft()) {
        return BadRequest(dateOrError.value);
      }

      const setPreferredStartDateOrError =
        await this.useCases.setPreferredStartDate.execute(
          user,
          dateOrError.value,
        );

      if (setPreferredStartDateOrError.isLeft()) {
        return InternalServerError();
      }
      return OK(setPreferredStartDateOrError.value);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  setUserStudyAvailability = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const user = request.user;
      const payload = request.body as
        | {
            studyAvailability: Record<string, number>;
          }
        | undefined;
      if (!payload?.studyAvailability) {
        return BadRequest(new MissingRequiredParamsError());
      }
      const parsedUserStudyAvailabilityOrError = this.parseUserAvailability(
        payload.studyAvailability,
      );
      if (parsedUserStudyAvailabilityOrError.isLeft()) {
        return BadRequest(parsedUserStudyAvailabilityOrError.value);
      }
      const setUserStudyAvailabilityOrError =
        await this.useCases.setUserStudyAvailability.execute(
          user,
          parsedUserStudyAvailabilityOrError.value,
        );
      return OK(setUserStudyAvailabilityOrError);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  registerUserSubjectCustomizations = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const requestUser = request.user;
      const payload = request.body as
        | RegisterUserCustomizationsRequestBody
        | undefined;

      if (!requestUser.isAdmin()) {
        return Forbidden();
      }

      if (
        !payload ||
        !payload.userId ||
        !payload.courseId ||
        !payload.subjects
      ) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const userId = ID.parse(payload.userId);
      const courseId = ID.parse(payload.courseId);
      if (userId.isLeft() || courseId.isLeft()) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const parseResultOrError = parseSubjectsFromUpdateTaskTypesRequestBody(
        payload.subjects,
      );

      if (parseResultOrError.isLeft()) {
        return BadRequest(parseResultOrError.value);
      }

      const subjects = parseResultOrError.value;

      const registerUserCustomizationResultOrError =
        await this.useCases.registerUserCustomizationUseCase.execute(
          userId.value,
          courseId.value,
          subjects,
        );

      if (registerUserCustomizationResultOrError.isLeft()) {
        return BadRequest(registerUserCustomizationResultOrError.value);
      }

      return OK({ message: 'Customizations updated successfully' });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  updateUserInfo = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      const payload = request.body as UpdateUserInfoRequestPayload;

      if (!payload) {
        return BadRequest(new MissingRequiredParamsError());
      }

      if (
        !payload.name &&
        !payload.age &&
        !payload.jobPosition &&
        !payload.phone
      ) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const useCasePayload = { userId: user.data.id } as {
        userId: ID;
        name?: Name;
        age?: number;
        jobPosition?: string;
        phone?: Phone;
      };
      if (payload.name) {
        const nameOrError = Name.create(payload.name);
        if (nameOrError.isLeft()) {
          return BadRequest(nameOrError.value);
        }
        useCasePayload.name = nameOrError.value;
      }

      if (payload.phone) {
        const phoneOrError = Phone.create(payload.phone);
        if (phoneOrError.isLeft()) {
          return BadRequest(phoneOrError.value);
        }
        useCasePayload.phone = phoneOrError.value;
      }

      if (payload.age) {
        useCasePayload.age = payload.age;
      }

      if (payload.jobPosition) {
        useCasePayload.jobPosition = payload.jobPosition;
      }

      const updateUserInfoOrError =
        await this.useCases.updateUserInfo.execute(useCasePayload);

      if (updateUserInfoOrError.isLeft()) {
        return InternalServerError(updateUserInfoOrError.value);
      }

      return OK({
        isSuccess: true,
        isError: false,
        data: 'User info updated successfully',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  listUsers = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      if (!user.isAdmin()) {
        return Forbidden();
      }

      const userQuery = new UserQuery();

      const usersStudyTimes = await userQuery.listStudyTimeEntries();
      const studyTimesByUserId = new Map(
        usersStudyTimes.map((u) => [u._id, u]),
      );

      const usersData = await userQuery.listUsers();

      const mappedUsers = usersData
        .filter((userData) => userData.deleted === false)
        .filter((userData) => userData.role === 'student')
        .map((userData) => {
          const expectedWeekWorkloadInMinutes = Object.values(
            userData.studyAvailability,
          ).reduce((acc, curr) => acc + curr, 0);
          const expectedWeekWorkloadInHours =
            expectedWeekWorkloadInMinutes / 60;

          const loggedHoursForUser = studyTimesByUserId.get(userData._id);
          const loggedLast30Days = loggedHoursForUser?.studyTimeEntries.filter(
            (entry) => {
              const entryDate = new Date(entry.date);
              const today = new Date();
              const thirtyDaysAgo = new Date(
                today.setDate(today.getDate() - 30),
              );
              return entryDate >= thirtyDaysAgo;
            },
          );
          const loggedLast60Days = loggedHoursForUser?.studyTimeEntries.filter(
            (entry) => {
              const entryDate = new Date(entry.date);
              const today = new Date();
              const sixtyDaysAgo = new Date(
                today.setDate(today.getDate() - 60),
              );
              return entryDate >= sixtyDaysAgo;
            },
          );
          const loggedLast90Days = loggedHoursForUser?.studyTimeEntries.filter(
            (entry) => {
              const entryDate = new Date(entry.date);
              const today = new Date();
              const ninetyDaysAgo = new Date(
                today.setDate(today.getDate() - 90),
              );
              return entryDate >= ninetyDaysAgo;
            },
          );

          return {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone ?? 'Sem telefone',
            courses: Object.fromEntries(
              userData.courses.map((c) => [
                c.name,
                { expirationDate: c.expirationDate },
              ]),
            ),
            cpf: userData.cpf,
            lastAccess:
              loggedHoursForUser?.studyTimeEntries.sort((a, b) =>
                a.date > b.date ? -1 : 1,
              )[0].date ?? '1900-01-01',
            expectedWorkload: {
              '30 dias': expectedWeekWorkloadInHours * 4,
              '60 dias': expectedWeekWorkloadInHours * 8,
              '90 dias': expectedWeekWorkloadInHours * 12,
            },
            completedWorkload: {
              '30 dias':
                (loggedLast30Days ?? []).reduce(
                  (acc, curr) => acc + curr.amount,
                  0,
                ) / 3600,
              '60 dias':
                (loggedLast60Days ?? []).reduce(
                  (acc, curr) => acc + curr.amount,
                  0,
                ) / 3600,
              '90 dias':
                (loggedLast90Days ?? []).reduce(
                  (acc, curr) => acc + curr.amount,
                  0,
                ) / 3600,
            },
          };
        });

      return OK([...mappedUsers]);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  getUserSubjectListWithCustomizations = async (request: FastifyRequest) => {
    try {
      const requesterUser = request.user;
      const userId = request.params as { id?: string } | undefined;

      if (!userId?.id) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const userIdOrError = ID.parse(userId.id);
      if (userIdOrError.isLeft()) {
        return BadRequest(userIdOrError.value);
      }

      if (!requesterUser.isAdmin()) {
        return Forbidden();
      }

      const userQuery = new UserQuery();
      const user = await userQuery.userInfo({ id: userIdOrError.value });
      if (!user) {
        return NotFound(new UserNotFoundError());
      }

      const userSubjectStatusQuery = new UserSubjectsStatusQuery();
      const courseQuery = new MongooseCourseQuery();
      const result: {
        name: string;
        email: string;
        phone: string;
        courses: {
          [key: string]: {
            [key: string]: {
              id: string;
              enabled: boolean;
              topics: {
                [key: string]: {
                  id: string;
                  enabled: boolean;
                  study: boolean;
                  exercise: boolean;
                  review: boolean;
                  law_letter: boolean;
                };
              };
            };
          };
        };
      } = {
        name: user.data.name.value,
        email: user.data.email.value,
        phone: user.data.phone?.value ?? '',
        courses: {},
      };
      const courses = await courseQuery.listNames();
      const coursesMap = new Map(courses.map((c) => [c.id, c.name]));

      for (const courseId of user.data.courses.map((c) => c.id)) {
        const courseName = coursesMap.get(courseId.value);
        if (!courseName) {
          continue;
        }
        result.courses[courseName] = {};
        Object.assign(result.courses[courseName], { id: courseId.value });

        const subjects = await userSubjectStatusQuery.subjectsPosition(
          userIdOrError.value,
          courseId,
        );

        if (!subjects) {
          continue;
        }

        for (const subject of subjects) {
          result.courses[courseName][subject.name] = {
            id: subject.id,
            enabled: subject.active,
            topics: {},
          };

          for (const topic of subject.topics) {
            result.courses[courseName][subject.name].topics[topic.name] = {
              id: topic.id,
              enabled: topic.active,
              study: topic.taskType.includes('study'),
              exercise: topic.taskType.includes('exercise'),
              review: topic.taskType.includes('review'),
              law_letter: topic.taskType.includes('lawStudy'),
            };
          }
        }
      }

      return OK(result);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  updateUserCourses = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const payload = request.body as {
        userId: string;
        addedCourses: {
          id: string;
          registrationDate: string;
          expirationDate: string;
        }[];
        removedCourseIds: string[];
      };

      const userIdOrError = ID.parse(payload.userId);
      if (userIdOrError.isLeft()) {
        return BadRequest(userIdOrError.value);
      }

      const validAddedCourses: course[] = [];
      for (const course of payload.addedCourses) {
        const courseIdOrError = ID.parse(course.id);
        const expirationDateOrError = CalendarDate.fromString(
          course.expirationDate,
        );
        const registrationDateOrError = CalendarDate.fromString(
          course.registrationDate,
        );

        if (courseIdOrError.isLeft()) return BadRequest(courseIdOrError.value);
        if (expirationDateOrError.isLeft())
          return BadRequest(expirationDateOrError.value);
        if (registrationDateOrError.isLeft())
          return BadRequest(registrationDateOrError.value);

        validAddedCourses.push({
          id: courseIdOrError.value,
          expirationDate: expirationDateOrError.value,
          registrationDate: registrationDateOrError.value,
        });
      }

      const validRemovedCourseIds: ID[] = [];
      for (const courseId of payload.removedCourseIds) {
        const courseIdOrError = ID.parse(courseId);
        if (courseIdOrError.isLeft()) return BadRequest(courseIdOrError.value);
        validRemovedCourseIds.push(courseIdOrError.value);
      }

      const updateResult = await this.useCases.updateUserCourseUseCase.execute({
        userId: userIdOrError.value,
        addedCourses: validAddedCourses,
        removedCourses: validRemovedCourseIds,
      });

      if (updateResult.isLeft()) {
        return InternalServerError(updateResult.value);
      }

      return OK({
        isSuccess: true,
        isError: false,
        data: null,
        message: 'Cursos atualizados com sucesso',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };
  updateStudentInfoUseCase = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const payload = request.body as {
        email?: string;
        phone?: string;
        course?: {
          id: string;
          registrationDate: string;
          expirationDate: string;
        };
      };

      if (Object.keys(payload).length === 0) {
        return BadRequest(new Error('no items were received'));
      }

      const params = request.params as { id: string };
      const rawUserId = params.id;

      if (!rawUserId) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const userIdOrError = ID.parse(rawUserId);
      const emailOrError = payload.email
        ? Email.create(payload.email)
        : undefined;
      const phoneOrError = payload.phone
        ? Phone.create(payload.phone)
        : undefined;

      if (userIdOrError.isLeft()) {
        return BadRequest(userIdOrError.value);
      }

      if (emailOrError?.isLeft()) {
        return BadRequest(emailOrError.value);
      }

      const userUpdate: UpdateStudentInfoData = {
        userId: userIdOrError.value,
      };

      if (payload.course) {
        const ValidatingCourse = payload.course;
        const idOrError = ID.parse(ValidatingCourse.id);
        const expirationDateOrError = CalendarDate.fromString(
          ValidatingCourse.expirationDate,
        );
        const registrationDateOrError = CalendarDate.fromString(
          ValidatingCourse.registrationDate,
        );

        if (idOrError.isLeft()) {
          return BadRequest(idOrError.value);
        }

        if (expirationDateOrError.isLeft()) {
          return BadRequest(expirationDateOrError.value);
        }

        if (registrationDateOrError.isLeft()) {
          return BadRequest(registrationDateOrError.value);
        }

        const validCourse = {
          id: idOrError.value,
          expirationDate: expirationDateOrError.value,
          registrationDate: registrationDateOrError.value,
        } as course;

        userUpdate.course = validCourse;
      }

      const email = emailOrError?.value as Email;
      const phone = phoneOrError?.value as Phone;

      if (emailOrError) {
        userUpdate.email = email;
      }

      if (phoneOrError) {
        userUpdate.phone = phone;
      }

      const updateUserDetailsOrError =
        await this.useCases.updateStudentInfoUseCase.execute(userUpdate);

      if (updateUserDetailsOrError.isLeft()) {
        return InternalServerError(updateUserDetailsOrError.value);
      }

      return OK({
        isSuccess: true,
        isError: false,
        data: 'User details updated successfully',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  deleteUser = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const params = request.params as { id: string };
      const rawUserId = params.id;

      if (!rawUserId) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const userIdOrError = ID.parse(rawUserId);

      if (userIdOrError.isLeft()) {
        return BadRequest(userIdOrError.value);
      }

      await this.useCases.deleteUserUseCase.execute(userIdOrError.value);
      const firebaseAuthService = new FirebaseAuthService();
      await firebaseAuthService.deleteUser(userIdOrError.value.value);

      return OK({
        isSuccess: true,
        isError: false,
        data: 'User details updated successfully',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  updateRole = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const requesterUser = request.user;
      const payload = request.body as
        | { userId: string; role: string }
        | undefined;

      if (!requesterUser.isSuperAdmin()) {
        return Forbidden();
      }

      if (!payload || !payload.userId || !payload.role) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const userIdOrError = ID.parse(payload.userId);
      if (userIdOrError.isLeft()) {
        return BadRequest(userIdOrError.value);
      }

      const roleOrError = Role.create(payload.role);
      if (roleOrError.isLeft()) {
        return BadRequest(roleOrError.value);
      }

      const updateUserRoleUseCaseResultOrError =
        await this.useCases.updateUserRoleUseCase.execute({
          userId: userIdOrError.value,
          role: roleOrError.value,
          requester: requesterUser,
        });

      if (updateUserRoleUseCaseResultOrError.isLeft()) {
        return InternalServerError(updateUserRoleUseCaseResultOrError.value);
      }

      return OK({
        isSuccess: true,
        isError: false,
        data: null,
        message: 'User role updated successfully',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  uploadProfileImage = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    const { file } = request as FastifyMulterRequest;
    const userId = request.user.data.id;
    try {
      if (!file) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const storage = new FirebaseStorageService();

      const userInfo = await this.useCases.getUserDataUseCase.execute({
        userId,
      });

      if (userInfo.isLeft()) {
        return NotFound(userInfo.value);
      }

      const { data: userData } = userInfo.value;

      if (typeof userData.imagePath === 'string') {
        try {
          await storage.deleteFile(userData.imagePath);
        } catch (error) {
          console.log(
            `Erro ao deletar a imagem ${userData.imagePath} do firebase`,
          );
        }
      }

      const image: Sharp = sharp(file.path);

      if (!image) {
        return NotFound(new FileNotFoundError());
      }

      const metadata = await image.metadata();
      const width = metadata.width || 0;
      const height = metadata.height || 0;
      const sideLength = Math.min(width, height);

      const buffer = await image
        .extract({
          left: Math.floor((width - sideLength) / 2),
          top: Math.floor((height - sideLength) / 2),
          width: sideLength,
          height: sideLength,
        })
        .resize(500)
        .jpeg({ quality: 50 })
        .toBuffer();

      const imageUrlOrError = await storage.uploadFile(file.filename, buffer);

      if (imageUrlOrError.isLeft()) {
        return InternalServerError(imageUrlOrError.value);
      }

      const resultUseCase =
        await this.useCases.uploadProfileImageUseCase.execute({
          userId,
          imageUrl: imageUrlOrError.value.url,
          imagePath: imageUrlOrError.value.filePath,
        });

      if (resultUseCase.isLeft()) {
        return NotFound(resultUseCase.value);
      }

      return OK({
        isSuccess: true,
        isError: false,
        data: resultUseCase.value,
        message: 'Profile image created successfully',
      });
    } catch (error) {
      console.log(error);
      return InternalServerError();
    } finally {
      await unlink(file.path);
    }
  };

  deleteProfileImage = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    const userId = request.user.data.id;

    const resultUseCase = await this.useCases.deleteProfileImageUseCase.execute(
      { userId },
    );

    if (resultUseCase.isLeft()) {
      return InternalServerError(resultUseCase.value);
    }

    const storage = new FirebaseStorageService();

    await storage.deleteFile(resultUseCase.value);

    return OK({
      isSuccess: true,
      isError: false,

      data: resultUseCase.value,
      message: 'Profile image deleted successfully',
    });
  };

  getUserInformation = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    const userId = request.user.data.id;

    const resultUseCase =
      await this.useCases.getUserCourseInformationUseCase.execute({ userId });

    if (resultUseCase.isLeft()) {
      return BadRequest(resultUseCase.value);
    }

    const courses = resultUseCase.value.map((course) => ({
      id: course.id.value,
      name: course.name,
      expirationDate: course.expirationDate.value,
    }));

    return OK({
      data: courses,
      isSucess: true,
      isError: false,
    });
  };

  dailyPerformance = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const { userId } = request.params as { userId?: string };

    if (!userId) {
      return BadRequest(new MissingRequiredParamsError());
    }

    const userIdOrError = ID.parse(userId);

    if (userIdOrError.isLeft()) {
      return BadRequest(userIdOrError.value);
    }

    const result = await this.useCases.dailyPerformanceUseCase.execute(
      userIdOrError.value,
    );

    if (result.isLeft()) {
      return InternalServerError(result.value);
    }

    // Ordenar os dados por data
    const sortByDate = result.value.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    // Definir a última data existente nos dados
    const lastDate =
      sortByDate.length > 0
        ? new Date(sortByDate[sortByDate.length - 1].date)
        : new Date();

    // Gerar 30 dias retroativos a partir da última data
    const startDate = subDays(lastDate, 30);
    const endDate = lastDate;

    // Criar um mapa para preencher os dias
    const dateMap = new Map<
      string,
      { totalCorrectAmount: number; totalIncorrectAmount: number }
    >();

    sortByDate.forEach((note) => {
      dateMap.set(note.date, {
        totalCorrectAmount: note.totalCorrectAmount || 0,
        totalIncorrectAmount: note.totalIncorrectAmount || 0,
      });
    });

    // Preencher os dias faltantes com valores padrão
    const filledNotes = [];
    for (let date = startDate; date <= endDate; date = addDays(date, 1)) {
      const formattedDate = format(date, 'yyyy-MM-dd');
      filledNotes.push({
        date: formattedDate,
        totalCorrectAmount: dateMap.get(formattedDate)?.totalCorrectAmount || 0,
        totalIncorrectAmount:
          dateMap.get(formattedDate)?.totalIncorrectAmount || 0,
      });
    }

    return reply.status(200).send({ notes: filledNotes });
  };

  rollbackUser = async (request: FastifyRequest): Promise<HttpResponse> => {
    const { id } = request.params as { id: string };

    const userId = ID.parse(id);

    if (userId.isLeft()) {
      return BadRequest(userId.value);
    }

    const resultOrError = await this.useCases.rollbackUserUseCase.execute(
      userId.value,
    );

    if (resultOrError.isLeft()) {
      return InternalServerError(resultOrError.value);
    }

    const firebaseAuthMiddleware = new FirebaseAuthService();

    await firebaseAuthMiddleware.rollbackUser(userId.value.value);

    return OK({
      isSuccess: true,
      isError: false,
      data: null,
      message: 'User rolled back successfully',
    });
  };
}
