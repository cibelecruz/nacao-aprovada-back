import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { CompleteOnboardingUseCase } from '../../../application/user/CompleteOnboardingUseCase.js';
import { UserController } from '../controllers/user/UserController.js';
import routeAdapter from './route-adapter.js';
import { MongooseUserRepository } from '../../database/mongoose/MongooseUserRepository.js';
import { UpdatePreferredStartDateUseCase } from '../../../application/user/UpdatePreferredStartDateUseCase.js';
import { UpdateStudyAvailabilityUseCase } from '../../../application/user/UpdateStudyAvailabilityUseCase.js';
import { firebaseAuthMiddleware } from '../middlewares/firebaseAuthMiddleware.js';
import { PerformanceController } from '../controllers/performance/PerformanceController.js';
import { RegisterUserSubjectCustomizationsUseCase } from '../../../application/user/RegisterUserSubjectCustomizationsUseCase.js';
import { MongooseCourseQuery } from '../../database/mongoose/MongooseCourseQuery.js';
import { MongooseUserSubjectsStatusRepository } from '../../database/mongoose/MongooseUserSubjectsStatusRepository.js';
import { MongooseUserDailyProgress } from '../../database/mongoose/MongooseUserDailyProgressDAO.js';
import { AnalyticsController } from '../controllers/analytics/AnalyticsController.js';
import { UpdateUserInfoUseCase } from '../../../application/user/UpdateUserInfoUseCase.js';
import { UpdateUserRoleUseCase } from '../../../application/user/UpdateUserRoleUseCase.js';
import { UploadProfileImageUseCase } from '../../../application/user/CreateProfileImageUseCase.js';
import { upload } from '../middlewares/fastifyMulterMiddleware.js';
import { DeleteProfileImageUseCase } from '../../../application/user/DeleteProfileImageUseCase.js';
import { GetUserDataUseCase } from '../../../application/user/GetUserDataUseCase.js';
import { UpdateStudentInfoUseCase } from '../../../application/user/UpdateStudentInfoUseCase.js';
import { UpdateUserCourseUseCase } from '../../../application/user/UpdateUserCoursesUseCase.js';
import { DeleteUserUseCase } from '../../../application/user/DeleteUserUseCase.js';
import { GetUserCourseInformationUseCase } from '../../../application/user/GetUserCourseInformartionUseCase.js';
import { MongooseCourseRepository } from '../../database/mongoose/MongooseCourseRepository.js';
import { DailyPerformanceUseCase } from '../../../application/user/DailyPerformanceUseCase.js';
import { UpdateFrequencySendEmailReportUseCase } from '../../../application/user/UpdateFrequencySendEmailReportUseCase.js';
import { FetchAllSubjectsUseCase } from '../../../application/user/FetchAllSubjectsUseCase.js';
import { MongooseSubjectRepository } from '../../database/mongoose/MongooseSubjectRepository.js';
import { ReturnUserPerformanceUseCase } from '../../../application/user/ReturnUserPerformanceUseCase.js';
import { RollbackUserUseCase } from '../../../application/user/RollbackUserUseCase.js';
import { GetAllStudentPerformanceUseCase } from '../../../application/user/GetAllStudentPerformanceUseCase.js';
import { TaskQuery } from '../../database/mongoose/TaskQuery.js';
import { EnrollmentService } from '../../../domain/user/EnrollmentService.js';
import { MongooseTaskRepository } from '../../database/mongoose/MongooseTaskRepository.js';
import { EventDispatcher } from '../../../shared/EventDispatcher.js';

const eventDispatcher = EventDispatcher.getInstance();

const userController = new UserController({
  completeOnboardingUseCase: new CompleteOnboardingUseCase(
    new MongooseUserRepository(),
  ),
  setPreferredStartDate: new UpdatePreferredStartDateUseCase(
    new MongooseUserRepository(),
  ),
  setUserStudyAvailability: new UpdateStudyAvailabilityUseCase(
    new MongooseUserRepository(),
  ),
  registerUserCustomizationUseCase:
    new RegisterUserSubjectCustomizationsUseCase(
      new MongooseCourseQuery(),
      new MongooseUserSubjectsStatusRepository(),
    ),
  updateUserInfo: new UpdateUserInfoUseCase(new MongooseUserRepository()),
  updateUserRoleUseCase: new UpdateUserRoleUseCase(
    new MongooseUserRepository(),
  ),
  updateStudentInfoUseCase: new UpdateStudentInfoUseCase(
    new MongooseUserRepository(),
  ),
  updateUserCourseUseCase: new UpdateUserCourseUseCase(
    new MongooseUserRepository(),
    new EnrollmentService(
      new MongooseUserRepository(),
      new MongooseCourseRepository(),
      new MongooseTaskRepository(eventDispatcher),
      new MongooseUserSubjectsStatusRepository(),
    ),
  ),
  uploadProfileImageUseCase: new UploadProfileImageUseCase(
    new MongooseUserRepository(),
  ),
  deleteProfileImageUseCase: new DeleteProfileImageUseCase(
    new MongooseUserRepository(),
  ),
  getUserDataUseCase: new GetUserDataUseCase(new MongooseUserRepository()),
  deleteUserUseCase: new DeleteUserUseCase(new MongooseUserRepository()),
  getUserCourseInformationUseCase: new GetUserCourseInformationUseCase(
    new MongooseUserRepository(),
    new MongooseCourseRepository(),
  ),
  dailyPerformanceUseCase: new DailyPerformanceUseCase(
    new MongooseUserRepository(),
    new MongooseUserDailyProgress(),
  ),
  updateFrequencySendEmailReport: new UpdateFrequencySendEmailReportUseCase(
    new MongooseUserRepository(),
  ),
  fetchAllSubjectsUseCase: new FetchAllSubjectsUseCase(),
  returnUserPerformanceUseCase: new ReturnUserPerformanceUseCase(
    new MongooseUserRepository(),
    new MongooseCourseRepository(),
    new MongooseSubjectRepository(),
    new TaskQuery(),
  ),
  rollbackUserUseCase: new RollbackUserUseCase(new MongooseUserRepository()),
  getAllStudentPerformanceUseCase: new GetAllStudentPerformanceUseCase(
    new MongooseUserRepository(),
    new MongooseCourseRepository(),
    new MongooseSubjectRepository(),
    new TaskQuery(),
  ),
});

const analyticsController = new AnalyticsController(
  new MongooseUserDailyProgress(),
  new MongooseCourseQuery(),
  new MongooseUserRepository(),
);

const performanceController = new PerformanceController();

export default function (
  server: FastifyInstance,
  opts: FastifyPluginOptions,
  done: (err?: Error | undefined) => void,
) {
  server.addHook('preHandler', firebaseAuthMiddleware);
  server.post(
    '/set-frequency',
    routeAdapter(userController.updateFrequencySendEmailReport),
  );

  server.get('/fetch-subjects', userController.fetchAllSubjectByUserId);

  server.post(
    '/complete-onboarding',
    routeAdapter(userController.completeOnboarding),
  );
  server.get('/export-onboarding', userController.exportOnboarding);
  server.post(
    '/set-preferred-start-date',
    routeAdapter(userController.setPreferredStartDate),
  );
  server.post(
    '/set-study-availability',
    routeAdapter(userController.setUserStudyAvailability),
  );
  server.get(
    '/user-performance',
    routeAdapter(performanceController.getPerformanceSumary),
  );
  server.get(
    '/user-performance-statistic',
    routeAdapter(performanceController.getPerformanceStatistic),
  );
  server.post(
    '/subjects-customizations',
    routeAdapter(userController.registerUserSubjectCustomizations),
  );

  server.get('/current-user', async (request, reply) => {
    try {
      const user = request.user;
      const { role, onboardingComplete } = user.data;
      const userWithRole = {
        ...user.data,
        role: role?.value === 'admin' ? 'coach' : 'student',
        onboardingComplete: onboardingComplete ?? false,
      };
      return reply.status(200).send(userWithRole);
    } catch (error) {
      console.error(error);
      return reply.status(500).send({ error: 'Internal Server Error' });
    }
  });

  server.get('/', routeAdapter(userController.listUsers));

  server.get(
    '/info/:id',
    routeAdapter(analyticsController.coachDashboardUserGeneralInfo),
  );
  server.put('/info', routeAdapter(userController.updateUserInfo));
  server.get('/progress', routeAdapter(analyticsController.userProgress));

  server.get('/performance/:id', userController.getUserPerformanceByUserId);

  server.get(
    '/frequency/:id',
    routeAdapter(analyticsController.coachDashboardUserFrequency),
  );

  server.post(
    '/register-user-subjects-customizations',
    routeAdapter(userController.registerUserSubjectCustomizations),
  );

  server.get(
    '/schedule/:id',
    routeAdapter(userController.getUserSubjectListWithCustomizations),
  );

  server.get('/courses', routeAdapter(userController.getUserInformation));

  server.post('/update-role', routeAdapter(userController.updateRole));

  server.post(
    '/upload-image',
    {
      preHandler: [upload.single('file')],
    },
    routeAdapter(userController.uploadProfileImage),
  );

  server.delete('/image', routeAdapter(userController.deleteProfileImage));

  server.put(
    '/student/update/:id',
    routeAdapter(userController.updateStudentInfoUseCase),
  );

  server.put('/add-course', routeAdapter(userController.updateUserCourses));

  server.delete('/:id', routeAdapter(userController.deleteUser));
  server.get('/daily-performance/:userId', userController.dailyPerformance);

  server.put('/rollback/:id', routeAdapter(userController.rollbackUser));

  done();
}
