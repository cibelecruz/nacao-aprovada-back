import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { SubjectController } from '../controllers/subject/SubjectController.js';
import { MongooseSubjectRepository } from '../../database/mongoose/MongooseSubjectRepository.js';
import { AddSubjectUseCase } from '../../../application/subject/AddSubjectUseCase.js';
import { firebaseAuthMiddleware } from '../middlewares/firebaseAuthMiddleware.js';
import routeAdapter from './route-adapter.js';
import { RegisterSubjectCustomizationsUseCase } from '../../../application/subject/RegisterSubjectCustomizationsUseCase.js';
import { UpdateSubjectInfoUseCase } from '../../../application/subject/UpdateSubjectInfoUseCase.js';
import { DeleteSubjectUseCase } from '../../../application/subject/DeleteSubjectUseCase.js';

const subjectRepository = new MongooseSubjectRepository();
const addSubjectUseCase = new AddSubjectUseCase(subjectRepository);
const subjectController = new SubjectController({
  addSubject: addSubjectUseCase,
  registerSubjectCustomizationUseCase: new RegisterSubjectCustomizationsUseCase(
    subjectRepository,
  ),
  updateSubjectInfoUseCase: new UpdateSubjectInfoUseCase(subjectRepository),
  deleteSubjectUseCase: new DeleteSubjectUseCase(subjectRepository),
});

export default function SubjectRoutes(
  server: FastifyInstance,
  opts: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) {
  server.addHook('preHandler', firebaseAuthMiddleware);
  server.post('/create', routeAdapter(subjectController.addSubject));
  server.get('/:id', routeAdapter(subjectController.getOne));
  server.patch('/:id', routeAdapter(subjectController.update));
  server.get('/', routeAdapter(subjectController.getAll));
  server.delete('/:id', routeAdapter(subjectController.delete));
  server.post(
    '/register-subject-customizations',
    routeAdapter(subjectController.setTopics),
  );

  done();
}
