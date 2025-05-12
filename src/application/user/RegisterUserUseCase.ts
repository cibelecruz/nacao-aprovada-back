import { User } from '../../domain/user/User.js';
import { Cpf } from '../../domain/user/Cpf.js';
import { Email } from '../../domain/user/Email.js';
import { Phone } from '../../domain/user/Phone.js';
import { Role } from '../../domain/user/Role.js';
import { UserStudyAvailability } from '../../domain/user/UserStudyAvailability.js';
import { UseCase } from '../../shared/UseCase.js';
import { UserRepository } from '../../domain/user/UserRepository.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { Name } from '../../domain/user/Name.js';
import { ID } from '../../domain/Id.js';
import { CalendarDate } from '../../domain/CalendarDate.js';
import { AuthService } from '../auth/AuthService.js';
import { Password } from '../../domain/user/Password.js';
import { EnrollmentService } from '../../domain/user/EnrollmentService.js';

type UserCourse = {
  id: ID;
  registrationDate: CalendarDate;
  expirationDate: CalendarDate;
};

type UserData = {
  preferedStartDate?: CalendarDate;
  studyAvailability?: UserStudyAvailability;
  name: Name;
  courses: UserCourse[];
  email: Email;
  cpf?: Cpf;
  phone?: Phone;
  role: Role;
};

export class RegisterUserUseCase implements UseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
    private readonly enrollmentService: EnrollmentService,
  ) {}

  async execute(
    userData: UserData,
  ): Promise<Either<Error, { id: ID; email: Email; password: Password }>> {
    const userOrError = User.create({
      name: userData.name,
      email: userData.email,
      cpf: userData.cpf,
      phone: userData.phone,
      preferedStartDate: userData.preferedStartDate,
      studyAvailability: userData.studyAvailability,
      role: userData.role,
    });
    if (userOrError.isLeft()) {
      return left(new Error());
    }

    const user = userOrError.value;
    const password = Password.random();
    console.log(password);
    await this.authService.createUser({
      email: user.data.email,
      name: user.data.name,
      id: user.data.id,
      password: password,
      role: user.data.role!,
    });
    await this.userRepository.create(user);

    const errors: Error[] = [];
    for (const course of userData.courses) {
      const r = await this.enrollmentService.enrollUser(
        user.data.id,
        course.id,
        course.registrationDate,
        course.expirationDate,
      );
      if (r.isLeft()) {
        errors.push(r.value);
      }
    }

    if (errors.length > 0) {
      return left(new Error(errors.map((e) => e.message).join(';')));
    }

    return right({
      id: userOrError.value.data.id,
      password,
      email: user.data.email,
    });
  }
}
