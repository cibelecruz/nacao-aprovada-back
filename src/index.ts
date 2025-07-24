import 'dotenv/config';
import fastify from 'fastify';
import fastifyMulter from 'fastify-multer';
import { User } from './domain/user/User.js';
import { initializeApp, cert } from 'firebase-admin/app';
// import { readFileSync } from 'fs'; // Remova ou comente esta linha
import cors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import { MongoDBConnectorManager } from './infrastructure/database/mongoose/utils/MongoDBConnector.js';
import userRoutes from './infrastructure/http/routes/user-routes.js';
import taskRoutes from './infrastructure/http/routes/task-routes.js';
import taskNoteRoutes from './infrastructure/http/routes/task-note-routes.js';
import postbackRoutes from './infrastructure/http/routes/postback-routes.js';
import coursesRoutes from './infrastructure/http/routes/course-route.js';
import routeAdapter from './infrastructure/http/routes/route-adapter.js';
import { RegisterUserController } from './infrastructure/http/controllers/user/RegisterUserController.js';
import { RegisterUserUseCase } from './application/user/RegisterUserUseCase.js';
import { MongooseUserRepository } from './infrastructure/database/mongoose/MongooseUserRepository.js';
import { FirebaseAuthService } from './infrastructure/services/auth/FirebaseAuthService.js';
import { EnrollmentService } from './domain/user/EnrollmentService.js';
import { EnrollUserInCourseController } from './infrastructure/http/controllers/user/EnrollUserInCourseController.js';
import { EnrollUserInCourseUseCase } from './application/user/EnrollUserInCourseUseCase.js';
import { MongooseCourseRepository } from './infrastructure/database/mongoose/MongooseCourseRepository.js';
import { MongooseTaskRepository } from './infrastructure/database/mongoose/MongooseTaskRepository.js';
import { subject } from './mock/lesson/lesson.js';
import { MongooseUserSubjectsStatusRepository } from './infrastructure/database/mongoose/MongooseUserSubjectsStatusRepository.js';
import { EventDispatcher } from './shared/EventDispatcher.js';
import { NextTaskCreationHandler } = from './application/handlers/NextTaskCreationHandler.js';
import { TaskCreationService } from './domain/task/TaskCreationService.js';
import { CreateUserFromHotmartPostbackHandler } from './application/handlers/CreateUserFromHotmartPostbackHandler.js';
import { AnalyticsDashboardHandler } from './application/handlers/AnalyticsCoachDashboardHandler.js';
import { MongooseUserDailyProgress } from './infrastructure/database/mongoose/MongooseUserDailyProgressDAO.js';
import { DailyProgressService } from './application/analytics/RegisterDailyProgressService.js';
import subjectRoutes from './infrastructure/http/routes/subject-routes.js';

import notificationRoute from './infrastructure/http/routes/notification-route.js';
import helpContentRoute from './infrastructure/http/routes/help-content-route.js';
import { upload } from './infrastructure/http/middlewares/fastifyMulterMiddleware.js';
import { RegisterManyUsersUseCase } from './application/user/RegisterManyUsersUseCase.js';
import simulationRoute from './infrastructure/http/routes/simulation-route.js';
import { HelpContentController } from './infrastructure/http/controllers/helpContent/HelpContentController.js';
import { CreateHelpContentUseCase } from './application/helpContent/CreateHelpContentUseCase.js';
import { MongooseHelpContentRepository } from './infrastructure/database/mongoose/MongooseHelpContentRepository.js';
import { DeleteHelpContentUseCase } from './application/helpContent/DeleteHelpContentUseCase.js';
import { FetchHelpContentUseCase } from './application/helpContent/FetchHelpContentUseCase.js';
import { UpdateHelpContentUseCase } from './application/helpContent/UpdateHelpContentUseCase.js';
import { ToggleHelpContentAccessUseCase } from './application/helpContent/ToggleHelpContentAccessUseCase.js';
import { FetchIAHelpContentUseCase } from './application/helpContent/FetchIAHelpContentUseCase.js';
import { GetHelpContentUseCase } from './application/helpContent/GetHelpContentUseCase.js';
import { EmailScheduler } from './application/handlers/SendWeeklyNotificationHandler.js';
import { SendUserPasswordHandler } from './application/handlers/SendUserPasswordHandler.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: User;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
// const serviceAccount = JSON.parse(
//   readFileSync('./src/nacao-aprovada-firebase.json', 'utf-8')
// );

initializeApp({
  storageBucket: process.env.STORAGE_BUCKET, // Mantenha este se ainda for usado
  credential: cert({ // <--- AQUI VAMOS PASSAR AS CREDENCIAIS DIRETAMENTE
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'), // Converte \\n para quebras de linha reais
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const server = fastify();
await server.register(cors, {
  origin: '*',
});

await server.register(fastifyEnv, {
  confKey: 'config',
  dotenv: true,
  schema: {
    type: 'object',
    required: ['MONGODB_URI'],
    properties: {
      MONGODB_URI: {
        type: 'string',
      },
    },
  },
  data: process.env,
});

await server.register(fastifyMulter.contentParser);

server.get('/ping', () => {
  return 'pong\n';
});

const eventDispatcher = EventDispatcher.getInstance();

const createUserFromHotmartPostbackHandler =
  new CreateUserFromHotmartPostbackHandler();

const nextTaskCreationHandler = new NextTaskCreationHandler(
  new TaskCreationService(
    new MongooseTaskRepository(eventDispatcher),
    new UserSubjectsStatusQuery(),
  ),
);

const helpContentController = new HelpContentController({
  createHelpContentUseCase: new CreateHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  deleteHelpContentUseCase: new DeleteHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  fetchHelpContentUseCase: new FetchHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  updateHelpContentUseCase: new UpdateHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  toggleHelpContentAccessUseCase: new ToggleHelpContentAccessUseCase(
    new MongooseHelpContentRepository(),
  ),
  fetchIAHelpContentUseCase: new FetchIAHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  getHelpContentUseCase: new GetHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
});

server.get('/help-content/ia', helpContentController.fetchIAContent);

const analyticsDashboardHandler = new AnalyticsDashboardHandler(
  new DailyProgressService(new MongooseUserDailyProgress()),
);

eventDispatcher.registerHandler(
  'TaskCompleted',
  nextTaskCreationHandler.handle.bind(nextTaskCreationHandler),
);

eventDispatcher.registerHandler(
  'TaskCompleted',
  analyticsDashboardHandler.handleTaskCompleted.bind(analyticsDashboardHandler),
);

eventDispatcher.registerHandler(
  'TaskNoteRegistered',
  analyticsDashboardHandler.handleTaskNoteRegistration.bind(
    analyticsDashboardHandler,
  ),
);

eventDispatcher.registerHandler(
  'HotmartPostbackReceived',
  createUserFromHotmartPostbackHandler.handle.bind(
    createUserFromHotmartPostbackHandler,
  ),
);

const registerUserController = new RegisterUserController({
  registerUserUseCase: new RegisterUserUseCase(
    new MongooseUserRepository(),
    new FirebaseAuthService(),
    new EnrollmentService(
      new MongooseUserRepository(),
      new MongooseCourseRepository(),
      new MongooseTaskRepository(eventDispatcher),
      new MongooseUserSubjectsStatusRepository(),
    ),
  ),
  registerManyUsersUseCase: new RegisterManyUsersUseCase(
    new MongooseUserRepository(),
    new FirebaseAuthService(),
    new EnrollmentService(
      new MongooseUserRepository(),
      new MongooseCourseRepository(),
      new MongooseTaskRepository(eventDispatcher),
      new MongooseUserSubjectsStatusRepository(),
    ),
    new SendUserPasswordHandler(),
  ),
});

server.get('/subjects-list/:subejctId', async (request, reply) => {
  try {
    const subjects = subject;
    return reply.status(200).send(subjects);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

const enrollUserInCourseController = new EnrollUserInCourseController({
  enrollUserInCourse: new EnrollUserInCourseUseCase(
    new EnrollmentService(
      new MongooseUserRepository(),
      new MongooseCourseRepository(),
      new MongooseTaskRepository(eventDispatcher),
      new MongooseUserSubjectsStatusRepository(),
    ),
  ),
});

server.post(
  '/enroll-in-course',
  routeAdapter(enrollUserInCourseController.enrollUserInCourse),
);

server.post('/register-user', routeAdapter(registerUserController.create));

server.post(
  '/register-bulk-users',
  {
    preHandler: [upload.single('file')],
  },
  registerUserController.createBulk,
);

// ROTAS DE ADMIN/COACH SEM O PREFIXO /coach AQUI, POIS SERA INCLUIDO NA API_URL DO FRONTEND
await server.register(userRoutes, { prefix: '/users' });
await server.register(coursesRoutes, { prefix: '/courses' });
await server.register(taskRoutes, { prefix: '/tasks' });
await server.register(taskNoteRoutes, { prefix: '/task-note' });
await server.register(postbackRoutes, { prefix: '/postbacks' });
await server.register(subjectRoutes, { prefix: '/subjects' });
await server.register(notificationRoute, { prefix: '/notifications' });
await server.register(helpContentRoute, { prefix: '/help-content' });
await server.register(simulationRoute, { prefix: '/simulations' });

// Comentei as linhas do EmailScheduler para não causar crash
// const userRepository = new MongooseUserRepository();
// const emailScheduler = new EmailScheduler(userRepository);
// emailScheduler
//   .setupScheduler()
//   .then(() => {
//     console.log('Agendamento de emails configurado com sucesso.');
//   })
//   .catch((error) => {
//     console.error('Erro ao configurar agendamento de emails:', error);
//   });

new MongoDBConnectorManager(process.env.MONGODB_URI)
  .connect()
  .then(() => {
      server.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Server listening at ${address}`);
    });
  })
  .catch((error) => {
    console.error(error);
  });
  
/* import 'dotenv/config';
import fastify from 'fastify';
import fastifyMulter from 'fastify-multer';
import { User } from './domain/user/User.js';
import { initializeApp, cert } from 'firebase-admin/app';
import { readFileSync } from 'fs';
import cors from '@fastify/cors';
import fastifyEnv from '@fastify/env';
import { MongoDBConnectorManager } from './infrastructure/database/mongoose/utils/MongoDBConnector.js';
import userRoutes from './infrastructure/http/routes/user-routes.js';
import taskRoutes from './infrastructure/http/routes/task-routes.js';
import taskNoteRoutes from './infrastructure/http/routes/task-note-routes.js';
import postbackRoutes from './infrastructure/http/routes/postback-routes.js';
import coursesRoutes from './infrastructure/http/routes/course-route.js';
import routeAdapter from './infrastructure/http/routes/route-adapter.js';
import { RegisterUserController } from './infrastructure/http/controllers/user/RegisterUserController.js';
import { RegisterUserUseCase } from './application/user/RegisterUserUseCase.js';
import { MongooseUserRepository } from './infrastructure/database/mongoose/MongooseUserRepository.js';
import { FirebaseAuthService } from './infrastructure/services/auth/FirebaseAuthService.js';
import { EnrollmentService } from './domain/user/EnrollmentService.js';
import { EnrollUserInCourseController } from './infrastructure/http/controllers/user/EnrollUserInCourseController.js';
import { EnrollUserInCourseUseCase } from './application/user/EnrollUserInCourseUseCase.js';
import { MongooseCourseRepository } from './infrastructure/database/mongoose/MongooseCourseRepository.js';
import { MongooseTaskRepository } from './infrastructure/database/mongoose/MongooseTaskRepository.js';
import { subject } from './mock/lesson/lesson.js';
import { MongooseUserSubjectsStatusRepository } from './infrastructure/database/mongoose/MongooseUserSubjectsStatusRepository.js';
import { EventDispatcher } from './shared/EventDispatcher.js';
import { NextTaskCreationHandler } from './application/handlers/NextTaskCreationHandler.js';
import { TaskCreationService } from './domain/task/TaskCreationService.js';
import { CreateUserFromHotmartPostbackHandler } from './application/handlers/CreateUserFromHotmartPostbackHandler.js';
import { AnalyticsDashboardHandler } from './application/handlers/AnalyticsCoachDashboardHandler.js';
import { MongooseUserDailyProgress } from './infrastructure/database/mongoose/MongooseUserDailyProgressDAO.js';
import { DailyProgressService } from './application/analytics/RegisterDailyProgressService.js';
import subjectRoutes from './infrastructure/http/routes/subject-routes.js';
import { UserSubjectsStatusQuery } from './infrastructure/database/mongoose/UserSubjectsStatusQuery.js';

import notificationRoute from './infrastructure/http/routes/notification-route.js';
import helpContentRoute from './infrastructure/http/routes/help-content-route.js';
import { upload } from './infrastructure/http/middlewares/fastifyMulterMiddleware.js';
import { RegisterManyUsersUseCase } from './application/user/RegisterManyUsersUseCase.js';
import simulationRoute from './infrastructure/http/routes/simulation-route.js';
import { HelpContentController } from './infrastructure/http/controllers/helpContent/HelpContentController.js';
import { CreateHelpContentUseCase } from './application/helpContent/CreateHelpContentUseCase.js';
import { MongooseHelpContentRepository } from './infrastructure/database/mongoose/MongooseHelpContentRepository.js';
import { DeleteHelpContentUseCase } from './application/helpContent/DeleteHelpContentUseCase.js';
import { FetchHelpContentUseCase } from './application/helpContent/FetchHelpContentUseCase.js';
import { UpdateHelpContentUseCase } from './application/helpContent/UpdateHelpContentUseCase.js';
import { ToggleHelpContentAccessUseCase } from './application/helpContent/ToggleHelpContentAccessUseCase.js';
import { FetchIAHelpContentUseCase } from './application/helpContent/FetchIAHelpContentUseCase.js';
import { GetHelpContentUseCase } from './application/helpContent/GetHelpContentUseCase.js';
import { EmailScheduler } from './application/handlers/SendWeeklyNotificationHandler.js';
import { SendUserPasswordHandler } from './application/handlers/SendUserPasswordHandler.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: User;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
// const serviceAccount = JSON.parse(
//   readFileSync('./src/nacao-aprovada-firebase.json', 'utf-8')
// );

initializeApp({
  storageBucket: process.env.STORAGE_BUCKET, // Mantenha este se ainda for usado
  credential: cert({ // <--- AQUI VAMOS PASSAR AS CREDENCIAIS DIRETAMENTE
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'), // Converte \\n para quebras de linha reais
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

const server = fastify();
await server.register(cors, {
  origin: '*',
});

await server.register(fastifyEnv, {
  confKey: 'config',
  dotenv: true,
  schema: {
    type: 'object',
    required: ['MONGODB_URI'],
    properties: {
      MONGODB_URI: {
        type: 'string',
      },
    },
  },
  data: process.env,
});

await server.register(fastifyMulter.contentParser);

server.get('/ping', () => {
  return 'pong\n';
});

const eventDispatcher = EventDispatcher.getInstance();

const createUserFromHotmartPostbackHandler =
  new CreateUserFromHotmartPostbackHandler();

const nextTaskCreationHandler = new NextTaskCreationHandler(
  new TaskCreationService(
    new MongooseTaskRepository(eventDispatcher),
    new UserSubjectsStatusQuery(),
  ),
);

const helpContentController = new HelpContentController({
  createHelpContentUseCase: new CreateHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  deleteHelpContentUseCase: new DeleteHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  fetchHelpContentUseCase: new FetchHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  updateHelpContentUseCase: new UpdateHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  toggleHelpContentAccessUseCase: new ToggleHelpContentAccessUseCase(
    new MongooseHelpContentRepository(),
  ),
  fetchIAHelpContentUseCase: new FetchIAHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
  getHelpContentUseCase: new GetHelpContentUseCase(
    new MongooseHelpContentRepository(),
  ),
});

server.get('/help-content/ia', helpContentController.fetchIAContent);

const analyticsDashboardHandler = new AnalyticsDashboardHandler(
  new DailyProgressService(new MongooseUserDailyProgress()),
);

eventDispatcher.registerHandler(
  'TaskCompleted',
  nextTaskCreationHandler.handle.bind(nextTaskCreationHandler),
);

eventDispatcher.registerHandler(
  'TaskCompleted',
  analyticsDashboardHandler.handleTaskCompleted.bind(analyticsDashboardHandler),
);

eventDispatcher.registerHandler(
  'TaskNoteRegistered',
  analyticsDashboardHandler.handleTaskNoteRegistration.bind(
    analyticsDashboardHandler,
  ),
);

eventDispatcher.registerHandler(
  'HotmartPostbackReceived',
  createUserFromHotmartPostbackHandler.handle.bind(
    createUserFromHotmartPostbackHandler,
  ),
);

const registerUserController = new RegisterUserController({
  registerUserUseCase: new RegisterUserUseCase(
    new MongooseUserRepository(),
    new FirebaseAuthService(),
    new EnrollmentService(
      new MongooseUserRepository(),
      new MongooseCourseRepository(),
      new MongooseTaskRepository(eventDispatcher),
      new MongooseUserSubjectsStatusRepository(),
    ),
  ),
  registerManyUsersUseCase: new RegisterManyUsersUseCase(
    new MongooseUserRepository(),
    new FirebaseAuthService(),
    new EnrollmentService(
      new MongooseUserRepository(),
      new MongooseCourseRepository(),
      new MongooseTaskRepository(eventDispatcher),
      new MongooseUserSubjectsStatusRepository(),
    ),
    new SendUserPasswordHandler(),
  ),
});

server.get('/subjects-list/:subejctId', async (request, reply) => {
  try {
    const subjects = subject;
    return reply.status(200).send(subjects);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
});

const enrollUserInCourseController = new EnrollUserInCourseController({
  enrollUserInCourse: new EnrollUserInCourseUseCase(
    new EnrollmentService(
      new MongooseUserRepository(),
      new MongooseCourseRepository(),
      new MongooseTaskRepository(eventDispatcher),
      new MongooseUserSubjectsStatusRepository(),
    ),
  ),
});

server.post(
  '/enroll-in-course',
  routeAdapter(enrollUserInCourseController.enrollUserInCourse),
);

server.post('/register-user', routeAdapter(registerUserController.create));

server.post(
  '/register-bulk-users',
  {
    preHandler: [upload.single('file')],
  },
  registerUserController.createBulk,
);

await server.register(userRoutes, { prefix: '/users' });
await server.register(coursesRoutes, { prefix: '/courses' });
await server.register(taskRoutes, { prefix: '/tasks' });
await server.register(taskNoteRoutes, { prefix: '/task-note' });
await server.register(postbackRoutes, { prefix: '/postbacks' });
await server.register(subjectRoutes, { prefix: '/subjects' });
await server.register(notificationRoute, { prefix: '/notifications' });
await server.register(helpContentRoute, { prefix: '/help-content' });
await server.register(simulationRoute, { prefix: '/simulations' });

// const userRepository = new MongooseUserRepository(); // Comente essa linha também

// const emailScheduler = new EmailScheduler(userRepository); // Comente essa linha

// emailScheduler
//   .setupScheduler()
//   .then(() => {
//     console.log('Agendamento de emails configurado com sucesso.');
//   })
//   .catch((error) => {
//     console.error('Erro ao configurar agendamento de emails:', error);
//   });

new MongoDBConnectorManager(process.env.MONGODB_URI)
  .connect()
  .then(() => {
      server.listen({ port: 8080, host: '0.0.0.0' }, (err, address) => {
      if (err) {
        console.error(err);
        process.exit(1);
      }
      console.log(`Server listening at ${address}`);
    });
  })
  .catch((error) => {
    console.error(error);
  }); */