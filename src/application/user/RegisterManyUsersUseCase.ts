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
import type { SendUserPasswordHandler } from '../handlers/SendUserPasswordHandler.js';

type UserCourse = {
  id: ID;
  registrationDate: CalendarDate;
  expirationDate: CalendarDate;
};

type UserData = {
  preferredStartDate?: CalendarDate;
  studyAvailability?: UserStudyAvailability;
  name: Name;
  courses: UserCourse[];
  email: Email;
  cpf?: Cpf;
  phone?: Phone;
  role: Role;
};

export class RegisterManyUsersUseCase implements UseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authService: AuthService,
    private readonly enrollmentService: EnrollmentService,
    private readonly sendUserPassword: SendUserPasswordHandler,
  ) {}

  async execute(usersData: UserData[]): Promise<Either<Error, undefined>> {
    const users = usersData
      .map((user) => {
        const userOrError = User.create({
          preferedStartDate: user.preferredStartDate,
          studyAvailability: user.studyAvailability,
          name: user.name,
          courses: user.courses,
          email: user.email,
          cpf: user.cpf,
          phone: user.phone,
          role: user.role,
        });

        if (userOrError.isLeft()) {
          return null;
        }

        return userOrError.value;
      })
      .filter((user) => user !== null);

    await Promise.all(
      users.map(async (user) => {
        const password = Password.random();
        await this.sendUserPassword.sendPasswordForEmail({
          userEmail: user.data.email.value,
          userName: user.data.name.value,
          userPassword: password.value,
        });
        await this.authService.createUser({
          email: user.data.email,
          name: user.data.name,
          id: user.data.id,
          password,
          role: user.data.role ?? Role.createStudent(),
        });
      }),
    );

    await this.userRepository.registerManyUsers(users);

    const errors: Error[] = [];
    for (const user of users) {
      for (const course of user.data.courses) {
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
    }
    return right(undefined);
  }
}
