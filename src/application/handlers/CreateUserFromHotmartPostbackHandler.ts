import { HotmartPostbackReceivedEvent } from '../../domain/events/HotmartPostbackReceivedEvent.js';
import { Cpf } from '../../domain/user/Cpf.js';
import { Email } from '../../domain/user/Email.js';
import { EnrollmentService } from '../../domain/user/EnrollmentService.js';
import { Name } from '../../domain/user/Name.js';
import { Phone } from '../../domain/user/Phone.js';
import { Role } from '../../domain/user/Role.js';
import { HotmartPostbackModel } from '../../infrastructure/database/mongoose/models/HotmartPostbackModel.js';
import { MongooseCourseRepository } from '../../infrastructure/database/mongoose/MongooseCourseRepository.js';
import { MongooseTaskRepository } from '../../infrastructure/database/mongoose/MongooseTaskRepository.js';
import { MongooseUserRepository } from '../../infrastructure/database/mongoose/MongooseUserRepository.js';
import { MongooseUserSubjectsStatusRepository } from '../../infrastructure/database/mongoose/MongooseUserSubjectsStatusRepository.js';
import { FirebaseAuthService } from '../../infrastructure/services/auth/FirebaseAuthService.js';
import { EventDispatcher } from '../../shared/EventDispatcher.js';
import { RegisterUserUseCase } from '../user/RegisterUserUseCase.js';

const eventDispatcher = EventDispatcher.getInstance();

const registerUserUseCase = new RegisterUserUseCase(
  new MongooseUserRepository(),
  new FirebaseAuthService(),
  new EnrollmentService(
    new MongooseUserRepository(),
    new MongooseCourseRepository(),
    new MongooseTaskRepository(eventDispatcher),
    new MongooseUserSubjectsStatusRepository(),
  ),
);

export class CreateUserFromHotmartPostbackHandler {
  constructor() {}
  async handle(event: HotmartPostbackReceivedEvent): Promise<void> {
    const model = await HotmartPostbackModel.findById(event.data.mongoId);
    if (!model) {
      throw new Error('HotmartPostbackModel not found');
    }
    try {
      if (event.data.event !== 'PURCHASE_APPROVED') {
        throw new Error('Event is not PURCHASE_APPROVED');
      }

      const nameOrError = Name.create(event.data.data.buyer.name.trim());
      const emailOrError = Email.create(event.data.data.buyer.email.trim());
      const cpfOrError = Cpf.create(event.data.data.buyer.document.trim());
      const phoneOrError = Phone.create(
        event.data.data.buyer.checkout_phone.trim(),
      );
      const roleOrError = Role.create('student');

      if (nameOrError.isLeft()) {
        throw nameOrError.value;
      }
      if (emailOrError.isLeft()) {
        throw emailOrError.value;
      }
      if (cpfOrError.isLeft()) {
        throw cpfOrError.value;
      }
      if (phoneOrError.isLeft()) {
        throw phoneOrError.value;
      }

      if (roleOrError.isLeft()) {
        throw roleOrError.value;
      }

      const userData = {
        name: nameOrError.value,
        email: emailOrError.value,
        cpf: cpfOrError.value,
        phone: phoneOrError.value,
        role: roleOrError.value,
        courses: [],
      };

      await registerUserUseCase.execute(userData);
      model.status = 'processed';
      await model.save();
    } catch (error) {
      console.log(error);
      model.status = 'error';
      await model.save();
    }
  }
}
