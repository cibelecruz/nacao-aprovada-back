import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import routeAdapter from './route-adapter.js';
import { firebaseAuthMiddleware } from '../middlewares/firebaseAuthMiddleware.js';
import { CourseController } from '../controllers/course/CourseController.js';
import { ImportSubjectsUseCase } from '../../../application/course/ImportSubjectsFromCourseUseCase.js';
import { MongooseCourseRepository } from '../../database/mongoose/MongooseCourseRepository.js';
import { CreateCourseUseCase } from '../../../application/course/CreateCourseUseCase.js';
import { UpdateTopicRelevanceByCourseUseCase } from '../../../application/course/UpdateTopicRelevanceByCourseUseCase.js';
import { UpdateTopicStatusByCourseUseCase } from '../../../application/course/UpdateTopicStatusByCourseUseCase.js';
import { UpdateSubjectStatusByCourseUseCase } from '../../../application/course/UpdateSubjectStatusByCourseUseCase .js';
import { DeleteCourseUseCase } from '../../../application/course/DeleteCourseUseCase.js';
import { UpdateSubjectRelevanceByCourseUseCase } from '../../../application/course/UpdateSubjectRelevanceByCourseUseCase.js';
import { UpdateCourseNameByCourseUseCase } from '../../../application/course/UpdateCourseNameByCourseUseCase.js';
import { AddSubjectUseCase } from '../../../application/course/AddSubjectUseCase.js';
import { MongooseSubjectRepository } from '../../database/mongoose/MongooseSubjectRepository.js';
import { DeleteSubjectInCourseUseCase } from '../../../application/course/DeleteSubjectInCourseUseCase.js';
import { EnrollmentService } from '../../../domain/user/EnrollmentService.js';
import { MongooseUserRepository } from '../../database/mongoose/MongooseUserRepository.js';
import { MongooseTaskRepository } from '../../database/mongoose/MongooseTaskRepository.js';
import { EventDispatcher } from '../../../shared/EventDispatcher.js';
import { MongooseUserSubjectsStatusRepository } from '../../database/mongoose/MongooseUserSubjectsStatusRepository.js';

const eventDispatcher = EventDispatcher.getInstance();

const courseController = new CourseController({
  importSubjects: new ImportSubjectsUseCase(new MongooseCourseRepository()),
  createCourse: new CreateCourseUseCase(new MongooseCourseRepository()),
  updateTopicRelevanceByCourseUseCase: new UpdateTopicRelevanceByCourseUseCase(
    new MongooseCourseRepository(),
  ),
  updateTopicStatusByCourseUseCase: new UpdateTopicStatusByCourseUseCase(
    new MongooseCourseRepository(),
  ),
  updateSubjectStatusByCourseUseCase: new UpdateSubjectStatusByCourseUseCase(
    new MongooseCourseRepository(),
  ),
  updateCourseNameByCourseUseCase: new UpdateCourseNameByCourseUseCase(
    new MongooseCourseRepository(),
  ),
  deleteCourseUseCase: new DeleteCourseUseCase(
    new MongooseCourseRepository(),
    new EnrollmentService(
      new MongooseUserRepository(),
      new MongooseCourseRepository(),
      new MongooseTaskRepository(eventDispatcher),
      new MongooseUserSubjectsStatusRepository(),
    ),
  ),
  updateSubjectRelevanceByCourseUseCase:
    new UpdateSubjectRelevanceByCourseUseCase(new MongooseCourseRepository()),
  addSubjectUseCase: new AddSubjectUseCase(
    new MongooseCourseRepository(),
    new MongooseSubjectRepository(),
  ),
  deleteSubjectInCourseUseCase: new DeleteSubjectInCourseUseCase(
    new MongooseCourseRepository(),
  ),
});

export default function (
  server: FastifyInstance,
  opts: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) {
  server.addHook('preHandler', firebaseAuthMiddleware);
  server.post('/create', routeAdapter(courseController.createCourse));
  server.get('/course-info/:id', routeAdapter(courseController.courseInfo));
  server.get(
    '/user-course-info',
    routeAdapter(courseController.listCourseInfo),
  );
  server.post(
    '/import-subjects',
    routeAdapter(courseController.importSubjects),
  );
  server.post('/add-subject', routeAdapter(courseController.addSubject));
  server.get('/list', routeAdapter(courseController.listCourses));
  server.put('/topic', routeAdapter(courseController.updateTopic));
  server.put('/subject', routeAdapter(courseController.updateSubjectStatus));
  server.put(
    '/subject/relevance',
    routeAdapter(courseController.updateSubjectRelevance),
  );
  server.put(
    '/course-name/:id',
    routeAdapter(courseController.updateCourseName),
  );
  server.delete('/:id', routeAdapter(courseController.deleteCourse));
  server.delete(
    '/:courseId/subjects/:subjectId',
    routeAdapter(courseController.deleteSubjectInCourse),
  );

  server.get('/course-name/:id', courseController.returnCourseName);

  done();
}
