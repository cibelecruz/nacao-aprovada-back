import { FastifyRequest } from 'fastify';
import {
  HttpResponse,
  BadRequest,
  InternalServerError,
  OK,
} from '../../utils/responseHelpers.js';
import { MissingRequiredParamsError } from '../../../../errors/MissingRequiredParamsError.js';
import { ID } from '../../../../domain/Id.js';
import { EnrollUserInCourseUseCase } from '../../../../application/user/EnrollUserInCourseUseCase.js';
import { UserAlreadyEnrolledInCourse } from '../../../../errors/UserAlreadyEnrolledInCourseError.js';
import { CalendarDate } from '../../../../domain/CalendarDate.js';

type EnrollUserControllerUseCases = {
  enrollUserInCourse: EnrollUserInCourseUseCase;
};

export class EnrollUserInCourseController {
  constructor(private readonly useCases: EnrollUserControllerUseCases) {}

  enrollUserInCourse = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const payload = request.body as {
        courses?: string[];
        userId?: string;
        registrationDate?: string;
        expirationDate?: string;
      };
      if (
        !payload.courses ||
        payload.courses.length === 0 ||
        !payload.userId ||
        !payload.registrationDate ||
        !payload.expirationDate
      ) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const userIdOrError = ID.parse(payload.userId);
      if (userIdOrError.isLeft()) {
        return BadRequest(userIdOrError.value);
      }

      const registrationDate = CalendarDate.fromString(
        payload.registrationDate,
      );
      if (registrationDate.isLeft()) {
        return BadRequest(registrationDate.value);
      }

      const expirationDate = CalendarDate.fromString(payload.expirationDate);
      if (expirationDate.isLeft()) {
        return BadRequest(expirationDate.value);
      }

      const result = [];

      for (const courseId of payload.courses) {
        const courseIdOrError = ID.parse(courseId);
        if (courseIdOrError.isLeft()) {
          return BadRequest(courseIdOrError.value);
        }

        const enrollUserInCourseOrError =
          await this.useCases.enrollUserInCourse.execute(
            userIdOrError.value,
            courseIdOrError.value,
            registrationDate.value,
            expirationDate.value,
          );

        if (enrollUserInCourseOrError.isLeft()) {
          if (
            enrollUserInCourseOrError.value instanceof
            UserAlreadyEnrolledInCourse
          ) {
            result.push(enrollUserInCourseOrError.value);
            continue;
          }
          result.push(enrollUserInCourseOrError.value);
          continue;
        }
      }

      return OK({
        isSuccess: true,
        isError: false,
        data: result.map((r) => r.message),
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };
}
