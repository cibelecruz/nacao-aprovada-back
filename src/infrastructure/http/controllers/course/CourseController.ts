import { FastifyRequest } from 'fastify';
import {
  HttpResponse,
  BadRequest,
  InternalServerError,
  OK,
  Forbidden,
  Updated,
} from '../../utils/responseHelpers.js';
import { MongooseUserRepository } from '../../../database/mongoose/MongooseUserRepository.js';
import { MongooseCourseRepository } from '../../../database/mongoose/MongooseCourseRepository.js';
import { UserNotFoundError } from '../../../../errors/UserNotFoundError.js';
import { MissingRequiredParamsError } from '../../../../errors/MissingRequiredParamsError.js';
import { ID } from '../../../../domain/Id.js';
import { ImportSubjectsUseCase } from '../../../../application/course/ImportSubjectsFromCourseUseCase.js';
import { MongooseCourseQuery } from '../../../database/mongoose/MongooseCourseQuery.js';
import { CreateCourseUseCase } from '../../../../application/course/CreateCourseUseCase.js';
import { UpdateTopicStatusByCourseUseCase } from '../../../../application/course/UpdateTopicStatusByCourseUseCase.js';
import { UpdateTopicRelevanceByCourseUseCase } from '../../../../application/course/UpdateTopicRelevanceByCourseUseCase.js';
import { CourseNotFoundError } from '../../../../errors/CourseNotFoundError.js';
import { UpdateSubjectStatusByCourseUseCase } from '../../../../application/course/UpdateSubjectStatusByCourseUseCase .js';
import { DeleteCourseUseCase } from '../../../../application/course/DeleteCourseUseCase.js';
import { UpdateSubjectRelevanceByCourseUseCase } from '../../../../application/course/UpdateSubjectRelevanceByCourseUseCase.js';
import { UpdateCourseNameByCourseUseCase } from '../../../../application/course/UpdateCourseNameByCourseUseCase.js';
import { CourseName } from '../../../../domain/course/CourseName.js';
import { AddSubjectUseCase } from '../../../../application/course/AddSubjectUseCase.js';
import { DeleteSubjectInCourseUseCase } from '../../../../application/course/DeleteSubjectInCourseUseCase.js';
import { UserSubjectsStatusQuery } from '../../../database/mongoose/UserSubjectsStatusQuery.js';
import type { EnrollmentService } from '../../../../domain/user/EnrollmentService.js';

type ImportSubjectRequestBody = {
  courseFrom?: string;
  courseTo?: string;
};

type CreateCourseRequestBody = {
  institution?: string;
  jobPosition?: string;
};

type UpdateSubjectRequestBody = {
  courseId?: string;
  subjectId?: string;
  active?: boolean;
};

type UpdateSubjectRelevanceRequestBody = {
  courseId?: string;
  subjectId?: string;
  relevance?: number;
};

type UpdateTopicRequestBody = {
  id?: string;
  idTopic?: string;
  active?: boolean;
  relevance?: number;
};

type CourseControllerUseCases = {
  updateTopicStatusByCourseUseCase: UpdateTopicStatusByCourseUseCase;
  importSubjects: ImportSubjectsUseCase;
  createCourse: CreateCourseUseCase;
  updateTopicRelevanceByCourseUseCase: UpdateTopicRelevanceByCourseUseCase;
  updateSubjectStatusByCourseUseCase: UpdateSubjectStatusByCourseUseCase;
  deleteCourseUseCase: DeleteCourseUseCase;
  updateSubjectRelevanceByCourseUseCase: UpdateSubjectRelevanceByCourseUseCase;
  updateCourseNameByCourseUseCase: UpdateCourseNameByCourseUseCase;
  addSubjectUseCase: AddSubjectUseCase;
  deleteSubjectInCourseUseCase: DeleteSubjectInCourseUseCase;
};

export class CourseController {
  constructor(private readonly useCases: CourseControllerUseCases) {}

  listCourseInfo = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const userId = request.user.data.id;

      const userRepository = new MongooseUserRepository();

      const userInfo = await userRepository.ofId(userId);

      if (!userInfo) {
        return BadRequest(new UserNotFoundError());
      }

      const userSubjectStatusQuery = new UserSubjectsStatusQuery();

      const courseRepository = new MongooseCourseRepository();

      const coursesInfo = await Promise.all(
        userInfo.data.courses.map(async (course) => {
          const courseInfo = await courseRepository.ofId(course.id);

          if (!courseInfo) return null;

          const subjects = await userSubjectStatusQuery.subjectsPosition(
            userId,
            course.id,
          );

          return {
            _id: courseInfo.data._id.value,
            name: courseInfo.data.name,
            subjects: subjects?.map((subject) => ({
              id: subject.id,
              name: subject.name,
              relevance: subject.relevance,
              active: subject.active,
              topics: subject.topics.map((topic) => ({
                id: topic.id,
                active: topic.active,
                name: topic.name,
                relevance: topic.relevance,
              })),
            })),
          };
        }),
      );

      const filteredCoursesInfo = coursesInfo.filter(
        (course) => course !== null,
      );

      return OK(filteredCoursesInfo);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  importSubjects = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      const payload = request.body as ImportSubjectRequestBody | undefined;

      if (!user.isAdmin()) {
        return Forbidden();
      }

      if (!payload) {
        return BadRequest(new MissingRequiredParamsError());
      }

      if (!payload.courseFrom || !payload.courseTo) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const courseFrom = ID.parse(payload.courseFrom);
      if (courseFrom.isLeft()) {
        return BadRequest(courseFrom.value);
      }
      const courseTo = ID.parse(payload.courseTo);
      if (courseTo.isLeft()) {
        return BadRequest(courseTo.value);
      }

      const resultOrError = await this.useCases.importSubjects.execute(
        courseFrom.value,
        courseTo.value,
      );

      if (resultOrError.isLeft()) {
        return InternalServerError(resultOrError.value);
      }

      return OK({
        isSucces: true,
        isError: false,
        message: 'Disciplinas importadas com sucesso',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  listCourses = async (): Promise<HttpResponse> => {
    try {
      const courseQuery = new MongooseCourseQuery();
      const courses = await courseQuery.listNames();

      return OK({
        isSuccess: true,
        isError: false,
        data: courses.map((course) => ({
          institution: course.name.split('-')[0],
          jobPosition: course.name.split('-')[1] ?? '',
          id: course.id,
        })),
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  createCourse = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      const payload = request.body as CreateCourseRequestBody | undefined;

      if (!user.isAdmin()) {
        return Forbidden();
      }

      if (!payload) {
        return BadRequest(new MissingRequiredParamsError());
      }

      if (!payload.institution || !payload.jobPosition) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const name = `${payload.institution} - ${payload.jobPosition}`;

      const resultOrError = await this.useCases.createCourse.execute(name);

      if (resultOrError.isLeft()) {
        return InternalServerError(resultOrError.value);
      }

      return OK({
        isSuccess: true,
        isError: false,
        message: resultOrError.value.value,
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  updateTopic = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      const payload = request.body as UpdateTopicRequestBody | undefined;

      if (!user.isAdmin()) {
        return Forbidden();
      }

      if (!payload) {
        return BadRequest(new MissingRequiredParamsError());
      }

      if (!payload.id || !payload.idTopic) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const id = ID.parse(payload.id);
      if (id.isLeft()) {
        return BadRequest(id.value);
      }
      const idTopic = ID.parse(payload.idTopic);
      if (idTopic.isLeft()) {
        return BadRequest(idTopic.value);
      }

      if (payload.active !== undefined) {
        const resultOrError =
          await this.useCases.updateTopicStatusByCourseUseCase.execute({
            courseId: id.value,
            topicId: idTopic.value,
            active: payload.active,
          });
        if (resultOrError.isLeft()) {
          return InternalServerError(resultOrError.value);
        }
      }

      if (payload.relevance !== undefined) {
        const resultOrError =
          await this.useCases.updateTopicRelevanceByCourseUseCase.execute({
            courseId: id.value,
            topicId: idTopic.value,
            relevance: payload.relevance,
          });
        if (resultOrError.isLeft()) {
          return InternalServerError(resultOrError.value);
        }
      }

      return Updated({
        isSuccess: true,
        isError: false,
        message: 'Tópico atualizado com sucesso',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  courseInfo = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      if (!user.isAdmin()) {
        return Forbidden();
      }
      if (!request.params) {
        return BadRequest(new MissingRequiredParamsError());
      }
      const requestParams = request.params as { id: string };
      const courseId = ID.parse(requestParams.id);
      if (courseId.isLeft()) {
        return BadRequest(courseId.value);
      }

      const courseQuery = new MongooseCourseQuery();
      const courseData = await courseQuery.courseInfo(courseId.value);
      if (!courseData) {
        return BadRequest(new CourseNotFoundError());
      }

      return OK(courseData);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  returnCourseName = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const requestParams = request.params as { id: string };
      const courseId = ID.parse(requestParams.id);
      if (courseId.isLeft()) {
        return BadRequest(courseId.value);
      }

      const courseQuery = new MongooseCourseQuery();
      const courseData = await courseQuery.courseInfo(courseId.value);
      if (!courseData) {
        return BadRequest(new CourseNotFoundError());
      }

      const courseName = courseData.name;

      return OK(courseName);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  updateSubjectStatus = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const user = request.user;
      const payload = request.body as UpdateSubjectRequestBody;

      if (!user.isAdmin()) {
        return Forbidden();
      }

      if (
        !payload.courseId ||
        !payload.subjectId ||
        payload.active === undefined
      ) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const courseId = ID.parse(payload.courseId);
      const subjectId = ID.parse(payload.subjectId);
      if (courseId.isLeft() || subjectId.isLeft()) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const subjectStatusResult =
        await this.useCases.updateSubjectStatusByCourseUseCase.execute({
          courseId: courseId.value,
          subjectId: subjectId.value,
          active: payload.active,
        });

      if (subjectStatusResult.isLeft()) {
        return InternalServerError(subjectStatusResult.value);
      }

      return Updated({
        isSuccess: true,
        isError: false,
        message: 'Subject status updated successfully',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  deleteCourse = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      if (!user.isAdmin()) {
        return Forbidden();
      }
      if (!request.params) {
        return BadRequest(new MissingRequiredParamsError());
      }
      const requestParams = request.params as { id: string };
      const courseId = ID.parse(requestParams.id);
      if (courseId.isLeft()) {
        return BadRequest(courseId.value);
      }

      const deleteCourseResult =
        await this.useCases.deleteCourseUseCase.execute(courseId.value);

      if (deleteCourseResult.isLeft()) {
        return InternalServerError(deleteCourseResult.value);
      }

      return OK({
        isSuccess: true,
        isError: false,
        message: 'Course deleted successfully',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  updateSubjectRelevance = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const user = request.user;
      const payload = request.body as
        | UpdateSubjectRelevanceRequestBody
        | undefined;

      if (!user.isAdmin()) {
        return Forbidden();
      }

      if (!payload) {
        return BadRequest(new MissingRequiredParamsError());
      }

      if (!payload.courseId || !payload.relevance || !payload.subjectId) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const courseId = ID.parse(payload.courseId);
      if (courseId.isLeft()) {
        return BadRequest(courseId.value);
      }
      const subjectId = ID.parse(payload.subjectId);
      if (subjectId.isLeft()) {
        return BadRequest(subjectId.value);
      }

      if (payload.relevance !== undefined) {
        const resultOrError =
          await this.useCases.updateSubjectRelevanceByCourseUseCase.execute({
            courseId: courseId.value,
            subjectId: subjectId.value,
            relevance: payload.relevance,
          });
        if (resultOrError.isLeft()) {
          return InternalServerError(resultOrError.value);
        }
      }

      return Updated({
        isSuccess: true,
        isError: false,
        message: 'Relevância atualizada com sucesso',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  updateCourseName = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;

      if (!user.isAdmin()) {
        return Forbidden();
      }

      const requestParams = request.params as { id: string };
      const courseId = ID.parse(requestParams.id);

      if (courseId.isLeft()) {
        return BadRequest(courseId.value);
      }

      const payload = request.body as { courseName?: string };

      if (!payload.courseName) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const courseNameOrError = CourseName.create(payload.courseName);
      if (courseNameOrError.isLeft()) {
        return BadRequest(courseNameOrError.value);
      }

      if (courseId.isLeft()) {
        return BadRequest(courseId.value);
      }

      const updateCourseNameResult =
        await this.useCases.updateCourseNameByCourseUseCase.execute({
          courseId: courseId.value,
          courseName: courseNameOrError.value,
        });
      if (updateCourseNameResult.isLeft()) {
        return InternalServerError(updateCourseNameResult.value);
      }

      return Updated({
        isSuccess: true,
        isError: false,
        message: 'Course name updated successfully',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  addSubject = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      if (!user.isAdmin()) {
        return Forbidden();
      }
      if (!request.body) {
        return BadRequest(new MissingRequiredParamsError());
      }
      const payload = request.body as { courseId: string; subjectId: string };
      if (!payload.courseId || !payload.subjectId) {
        return BadRequest(new MissingRequiredParamsError());
      }
      const courseId = ID.parse(payload.courseId);
      const subjectId = ID.parse(payload.subjectId);
      if (courseId.isLeft() || subjectId.isLeft()) {
        return BadRequest(new MissingRequiredParamsError());
      }

      const resultOrError = await this.useCases.addSubjectUseCase.execute(
        courseId.value,
        subjectId.value,
      );

      if (resultOrError.isLeft()) {
        return InternalServerError(resultOrError.value);
      }

      return Updated({
        isSuccess: true,
        isError: false,
        message: 'Subject added successfully',
      });
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };

  deleteSubjectInCourse = async (
    request: FastifyRequest,
  ): Promise<HttpResponse> => {
    try {
      const { courseId, subjectId } = request.params as {
        courseId: string;
        subjectId: string;
      };

      const courseIdParsed = ID.parse(courseId);
      const subjectIdParsed = ID.parse(subjectId);

      if (courseIdParsed.isLeft() || subjectIdParsed.isLeft()) {
        return BadRequest(new Error('Invalid course or subject ID'));
      }

      const resultOrError =
        await this.useCases.deleteSubjectInCourseUseCase.execute({
          courseId: courseIdParsed.value,
          subjectId: subjectIdParsed.value,
        });

      if (resultOrError.isLeft()) {
        return InternalServerError(resultOrError.value);
      }

      return Updated({ message: 'Subject deleted successfully' });
    } catch (error) {
      console.error(error);
      return InternalServerError(error as Error);
    }
  };
}
