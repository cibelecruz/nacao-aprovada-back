import { FastifyRequest, type FastifyReply } from 'fastify';
import { RegisterUserUseCase } from '../../../../application/user/RegisterUserUseCase.js';
import { Cpf } from '../../../../domain/user/Cpf.js';
import { Email } from '../../../../domain/user/Email.js';
import { Name } from '../../../../domain/user/Name.js';
import { Phone } from '../../../../domain/user/Phone.js';
import { CalendarDate } from '../../../../domain/CalendarDate.js';
import { UserStudyAvailability } from '../../../../domain/user/UserStudyAvailability.js';
import {
  HttpResponse,
  BadRequest,
  InternalServerError,
  OK,
} from '../../utils/responseHelpers.js';
import { Either, left, right } from '../../../../shared/utils/Either.js';
import { Weekday } from '../../../../domain/Weekday.js';
import { TimespanInMinutes } from '../../../../domain/user/TimespanInMinutes.js';
import { InvalidMinutesAvailableError } from '../../../../errors/InvalidMinutesAvailableError.js';
import { InvalidWeekdayError } from '../../../../errors/InvalidWeekdayError.js';
import { MissingRequiredParamsError } from '../../../../errors/MissingRequiredParamsError.js';
import { ID } from '../../../../domain/Id.js';
import { InvalidCalendarDate } from '../../../../errors/InvalidCalendarDate.js';
import { InvalidIdError } from '../../../../errors/InvalidIdError.js';
import { Role } from '../../../../domain/user/Role.js';
import { readFileSync, unlinkSync } from 'fs';
import type { RegisterManyUsersUseCase } from '../../../../application/user/RegisterManyUsersUseCase.js';
import type { SendUserPasswordHandler } from '../../../../application/handlers/SendUserPasswordHandler.js';

type UserCourseRequest = {
  id?: string;
  registrationDate?: string;
  expirationDate?: string;
};

export type RegisterUserRequestBody = {
  preferedStartDate?: string;
  studyAvailability?: Record<string, number>;
  name?: string;
  courses?: UserCourseRequest[];
  email?: string;
  cpf?: string;
  phone?: string;
  role: string;
};

type RegisterUserControllerUseCases = {
  registerUserUseCase: RegisterUserUseCase;
  registerManyUsersUseCase: RegisterManyUsersUseCase;
};

type UserCourse = {
  id: ID;
  registrationDate: CalendarDate;
  expirationDate: CalendarDate;
};

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

function parseUserCourse(
  course: UserCourseRequest,
): Either<Error | InvalidCalendarDate | InvalidIdError, UserCourse> {
  if (!course.id || !course.registrationDate || !course.expirationDate) {
    return left(new Error('Missing required parameters.'));
  }
  const idOrError = ID.parse(course.id);
  const registrationDateOrError = CalendarDate.fromString(
    course.registrationDate,
  );
  const expirationDateOrError = CalendarDate.fromString(course.expirationDate);

  if (idOrError.isLeft()) {
    return left(idOrError.value);
  }
  if (registrationDateOrError.isLeft()) {
    return left(registrationDateOrError.value);
  }
  if (expirationDateOrError.isLeft()) {
    return left(expirationDateOrError.value);
  }

  return right({
    id: idOrError.value,
    registrationDate: registrationDateOrError.value,
    expirationDate: expirationDateOrError.value,
  });
}

export class RegisterUserController {
  constructor(
    private readonly useCases: RegisterUserControllerUseCases,
    private readonly sendUserPasswordHandler: SendUserPasswordHandler,
  ) {}

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

  create = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const userData = request.body as RegisterUserRequestBody | undefined;
      if (!userData) {
        return BadRequest(new Error('Missing required parameters.'));
      }
      if (!userData.email || !userData.name) {
        return BadRequest(new Error('Missing required parameters.'));
      }

      let parsedUserStudyAvailabilityOrError:
        | Either<
            InvalidMinutesAvailableError | InvalidWeekdayError,
            UserStudyAvailability
          >
        | undefined = undefined;
      if (userData.studyAvailability) {
        parsedUserStudyAvailabilityOrError = this.parseUserAvailability(
          userData.studyAvailability,
        );
      }

      const preferedStartDateOrError = userData.preferedStartDate
        ? CalendarDate.fromString(userData.preferedStartDate)
        : undefined;
      const coursesOrError = userData.courses
        ? userData.courses.map(parseUserCourse)
        : undefined;
      const nameOrError = Name.create(userData.name);
      const emailOrError = Email.create(userData.email);
      const phoneOrError = userData.phone
        ? Phone.create(userData.phone)
        : undefined;
      const cpfOrError = userData.cpf ? Cpf.create(userData.cpf) : undefined;
      const roleOrError = Role.create(userData.role);

      if (preferedStartDateOrError && preferedStartDateOrError.isLeft()) {
        return BadRequest(preferedStartDateOrError.value);
      }
      if (
        parsedUserStudyAvailabilityOrError &&
        parsedUserStudyAvailabilityOrError.isLeft()
      ) {
        return BadRequest(parsedUserStudyAvailabilityOrError.value);
      }
      if (nameOrError.isLeft()) {
        return BadRequest(nameOrError.value);
      }
      if (emailOrError.isLeft()) {
        return BadRequest(emailOrError.value);
      }
      if (roleOrError.isLeft()) {
        return BadRequest(roleOrError.value);
      }
      if (phoneOrError && phoneOrError.isLeft()) {
        return BadRequest(phoneOrError.value);
      }
      if (cpfOrError && cpfOrError.isLeft()) {
        return BadRequest(cpfOrError.value);
      }
      if (!coursesOrError || coursesOrError.length <= 0) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const invalidCourses: Error[] = [];

      const validCourses: UserCourse[] = [];

      for (const courseOrError of coursesOrError) {
        if (courseOrError.isLeft()) {
          invalidCourses.push(courseOrError.value);
        } else {
          validCourses.push(courseOrError.value);
        }
      }

      if (invalidCourses.length > 0) {
        return BadRequest(
          new Error('Invalid courses found: ' + invalidCourses.join(', ')),
        );
      }

      const preferedStartDate = preferedStartDateOrError?.value;
      const studyAvailability = parsedUserStudyAvailabilityOrError?.value;
      const name = nameOrError.value;
      const email = emailOrError.value;
      const courses = validCourses;

      const registerUserOrError =
        await this.useCases.registerUserUseCase.execute({
          email,
          name,
          preferedStartDate,
          studyAvailability,
          courses,
          role: roleOrError.value,
        });

      if (registerUserOrError.isLeft()) {
        return InternalServerError(registerUserOrError.value);
      }

      const { success, error } =
        await this.sendUserPasswordHandler.sendPasswordForEmail({
          userEmail: registerUserOrError.value.email.value,
          userName: name.value,
          userPassword: registerUserOrError.value.password.value,
        });

      if (!success) {
        return InternalServerError(new Error(error));
      }

      console.log('Email sent to', registerUserOrError.value.email.value);

      return OK(registerUserOrError.value.id.value);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  createBulk = async (
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<HttpResponse> => {
    const { file } = request as FastifyMulterRequest;

    if (!file) {
      return BadRequest(new Error('Missing required parameters.'));
    }

    const fileContent = readFileSync(file.path, 'utf8');
    const rows = fileContent.split('\n');
    const headers = rows.shift()?.split(',');

    if (
      !headers ||
      !headers.includes('name') ||
      !headers.includes('email') ||
      !headers.includes('courses.id') ||
      !headers.includes('courses.registrationDate') ||
      !headers.includes('courses.expirationDate')
    ) {
      unlinkSync(file.path);
      return BadRequest(
        new Error(
          'Arquivo CSV inválido. As colunas obrigatórias são: name, email, course.id, course.registrationDate e course.expirationDate.',
        ),
      );
    }

    const userWithErrors = [] as { email: string; error: string }[];

    const usersData = rows
      .map((row, index) => {
        const values = row.split(',');
        const user = {
          name: values[headers.indexOf('name')]?.trim() || '',
          email: values[headers.indexOf('email')]?.trim() || '',
          courses: {
            id: values[headers.indexOf('courses.id')]?.trim() || '',
            registrationDate:
              values[headers.indexOf('courses.registrationDate')]?.trim() ||
              String(CalendarDate.today()),
            expirationDate:
              values[headers.indexOf('courses.expirationDate')]?.trim() ||
              String(CalendarDate.today().addDays(365)),
          },
          rowIndex: index + 2,
        };

        if (!user.name || !user.email || !user.courses.id) {
          return null;
        }

        const parsedCourse = parseUserCourse(user.courses);
        const validCourses = parsedCourse.isRight() ? parsedCourse.value : null;

        if (!validCourses) {
          userWithErrors.push({
            email: user.email || `Linha ${user.rowIndex}`,
            error: 'Curso inválido',
          });
          return null;
        }

        const emailOrError = Email.create(user.email);
        const nameOrError = Name.create(user.name);
        const role = Role.createStudent();

        if (emailOrError.isLeft() || nameOrError.isLeft()) {
          userWithErrors.push({
            email: user.email || `Linha ${user.rowIndex}`,
            error: [
              emailOrError.isLeft()
                ? `Email: ${emailOrError.value.message}`
                : null,
              nameOrError.isLeft()
                ? `Nome: ${nameOrError.value.message}`
                : null,
            ]
              .filter(Boolean)
              .join(' | '),
          });
          return null;
        }

        return {
          name: nameOrError.value,
          email: emailOrError.value,
          courses: [validCourses],
          role: role,
          preferredStartDate: CalendarDate.today(),
          studyAvailability: UserStudyAvailability.default(),
        };
      })
      .filter((user) => user !== null);

    const registerManyUsersOrError =
      await this.useCases.registerManyUsersUseCase.execute(usersData);

    unlinkSync(file.path);

    if (registerManyUsersOrError.isLeft()) {
      return InternalServerError(registerManyUsersOrError.value);
    }

    return reply.status(200).send({ userWithErrors });
  };
}
