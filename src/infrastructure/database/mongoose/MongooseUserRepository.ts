import { CalendarDate } from '../../../domain/CalendarDate.js';
import { ID } from '../../../domain/Id.js';
import { Weekday } from '../../../domain/Weekday.js';
import { Cpf } from '../../../domain/user/Cpf.js';
import { Email } from '../../../domain/user/Email.js';
import { Name } from '../../../domain/user/Name.js';
import { Phone } from '../../../domain/user/Phone.js';
import { Role } from '../../../domain/user/Role.js';
import { TimespanInMinutes } from '../../../domain/user/TimespanInMinutes.js';
import { User } from '../../../domain/user/User.js';
import { UserRepository } from '../../../domain/user/UserRepository.js';
import { UserStudyAvailability } from '../../../domain/user/UserStudyAvailability.js';
import { UserModel } from './models/UserModel.js';

export class MongooseUserRepository implements UserRepository {
  async listStudentsByCourse(courseId: ID): Promise<User[]> {
    const users = await UserModel.find({
      'courses.id': courseId.value,
    })
      .lean()
      .exec();

    return users.map((user) => {
      return User.restore({
        id: ID.create(user._id),
        courses: user.courses.map((c) => ({
          id: ID.create(c.id),
          registrationDate: CalendarDate.fromString(c.registrationDate)
            .value as CalendarDate,
          expirationDate: CalendarDate.fromString(c.expirationDate)
            .value as CalendarDate,
        })),
        email: Email.create(user.email).value as Email,
        name: Name.create(user.name).value as Name,
        phone: user?.phone as Phone | undefined,
        onboardingComplete: user.onboardingComplete,
        preferedStartDate: CalendarDate.fromString(user.preferredStartDate)
          .value as CalendarDate,
        studyAvailability: UserStudyAvailability.create(
          new Map([
            [
              Weekday.SUNDAY,
              TimespanInMinutes.create(user.studyAvailability.sunday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.MONDAY,
              TimespanInMinutes.create(user.studyAvailability.monday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.TUESDAY,
              TimespanInMinutes.create(user.studyAvailability.tuesday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.WEDNESDAY,
              TimespanInMinutes.create(user.studyAvailability.wednesday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.THURSDAY,
              TimespanInMinutes.create(user.studyAvailability.thursday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.FRIDAY,
              TimespanInMinutes.create(user.studyAvailability.friday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.SATURDAY,
              TimespanInMinutes.create(user.studyAvailability.saturday)
                .value as TimespanInMinutes,
            ],
          ]),
        ),
        role: user.role ? (Role.create(user.role).value as Role) : undefined,
        deleted: false,
        frequencySendPerformanceReport: user.frequencySendPerformanceReport,
      }).value;
    });
  }
  async getAllStudentsExcept(userId: ID): Promise<User[]> {
    const users = await UserModel.find({
      _id: { $ne: userId.value }, // Exclui o usuário atual
    })
      .lean()
      .exec();

    return users.map((user) => {
      return User.restore({
        id: ID.create(user._id),
        courses: user.courses.map((c) => ({
          id: ID.create(c.id),
          registrationDate: CalendarDate.fromString(c.registrationDate)
            .value as CalendarDate,
          expirationDate: CalendarDate.fromString(c.expirationDate)
            .value as CalendarDate,
        })),
        email: Email.create(user.email).value as Email,
        name: Name.create(user.name).value as Name,
        phone: user?.phone as Phone | undefined,
        onboardingComplete: user.onboardingComplete,
        preferedStartDate: CalendarDate.fromString(user.preferredStartDate)
          .value as CalendarDate,
        studyAvailability: UserStudyAvailability.create(
          new Map([
            [
              Weekday.SUNDAY,
              TimespanInMinutes.create(user.studyAvailability.sunday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.MONDAY,
              TimespanInMinutes.create(user.studyAvailability.monday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.TUESDAY,
              TimespanInMinutes.create(user.studyAvailability.tuesday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.WEDNESDAY,
              TimespanInMinutes.create(user.studyAvailability.wednesday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.THURSDAY,
              TimespanInMinutes.create(user.studyAvailability.thursday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.FRIDAY,
              TimespanInMinutes.create(user.studyAvailability.friday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.SATURDAY,
              TimespanInMinutes.create(user.studyAvailability.saturday)
                .value as TimespanInMinutes,
            ],
          ]),
        ),
        role: user.role ? (Role.create(user.role).value as Role) : undefined,
        deleted: false,
        frequencySendPerformanceReport: user.frequencySendPerformanceReport,
      }).value;
    });
  }
  async listStudents(): Promise<User[]> {
    const users = await UserModel.find().lean().exec();
    const userFormatted = users.map((user) => {
      return User.restore({
        id: ID.create(user._id),
        courses: user.courses.map((c) => ({
          id: ID.create(c.id),
          registrationDate: CalendarDate.fromString(c.registrationDate)
            .value as CalendarDate,
          expirationDate: CalendarDate.fromString(c.expirationDate)
            .value as CalendarDate,
        })),
        email: Email.create(user.email).value as Email,
        name: Name.create(user.name).value as Name,
        phone: user?.phone as Phone | undefined,
        onboardingComplete: user.onboardingComplete,
        preferedStartDate: CalendarDate.fromString(user.preferredStartDate)
          .value as CalendarDate,
        studyAvailability: UserStudyAvailability.create(
          new Map([
            [
              Weekday.SUNDAY,
              TimespanInMinutes.create(user.studyAvailability.sunday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.MONDAY,
              TimespanInMinutes.create(user.studyAvailability.monday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.TUESDAY,
              TimespanInMinutes.create(user.studyAvailability.tuesday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.WEDNESDAY,
              TimespanInMinutes.create(user.studyAvailability.wednesday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.THURSDAY,
              TimespanInMinutes.create(user.studyAvailability.thursday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.FRIDAY,
              TimespanInMinutes.create(user.studyAvailability.friday)
                .value as TimespanInMinutes,
            ],
            [
              Weekday.SATURDAY,
              TimespanInMinutes.create(user.studyAvailability.saturday)
                .value as TimespanInMinutes,
            ],
          ]),
        ),
        role: user.role ? (Role.create(user.role).value as Role) : undefined,
        deleted: false,
        frequencySendPerformanceReport: user.frequencySendPerformanceReport,
      }).value;
    });
    return userFormatted;
  }
  async create(user: User): Promise<void> {
    await new UserModel({
      _id: user.data.id.value,
      email: user.data.email.value,
      name: user.data.name.value,
      courses: user.data.courses.map((c) => ({
        id: c.id.value,
        registrationDate: c.registrationDate.value,
        expirationDate: c.expirationDate.value,
      })),
      phone: user.data.phone?.value,
      cpf: user.data.cpf?.value,
      age: user.data.age,
      jobPosition: user.data.jobPosition,
      preferredStartDate: user.data.preferedStartDate.value,
      role: user.data.role ? user.data.role.value : undefined,
      studyAvailability: {
        sunday: user.data.studyAvailability.getAvailability(Weekday.SUNDAY)
          .minutes,
        monday: user.data.studyAvailability.getAvailability(Weekday.MONDAY)
          .minutes,
        tuesday: user.data.studyAvailability.getAvailability(Weekday.TUESDAY)
          .minutes,
        wednesday: user.data.studyAvailability.getAvailability(
          Weekday.WEDNESDAY,
        ).minutes,
        thursday: user.data.studyAvailability.getAvailability(Weekday.THURSDAY)
          .minutes,
        friday: user.data.studyAvailability.getAvailability(Weekday.FRIDAY)
          .minutes,
        saturday: user.data.studyAvailability.getAvailability(Weekday.SATURDAY)
          .minutes,
      },
      onboardingComplete: user.data.onboardingComplete,
      imageUrl: user.data.imageUrl,
      imagePath: user.data.imagePath,
      frequencySendPerformanceReport: user.data.frequencySendPerformanceReport,
    }).save();
  }
  async save(user: User): Promise<void> {
    await UserModel.updateOne(
      {
        _id: user.data.id.value,
      },
      {
        courses: user.data.courses.map((c) => ({
          id: c.id.value,
          registrationDate: c.registrationDate.value,
          expirationDate: c.expirationDate.value,
        })),
        name: user.data.name.value,
        phone: user.data.phone?.value,
        preferredStartDate: user.data.preferedStartDate.value,
        age: user.data.age,
        cpf: user.data.cpf?.value,
        jobPosition: user.data.jobPosition,
        role: user.data.role?.value,
        studyAvailability: {
          sunday: user.data.studyAvailability.getAvailability(Weekday.SUNDAY)
            .minutes,
          monday: user.data.studyAvailability.getAvailability(Weekday.MONDAY)
            .minutes,
          tuesday: user.data.studyAvailability.getAvailability(Weekday.TUESDAY)
            .minutes,
          wednesday: user.data.studyAvailability.getAvailability(
            Weekday.WEDNESDAY,
          ).minutes,
          thursday: user.data.studyAvailability.getAvailability(
            Weekday.THURSDAY,
          ).minutes,
          friday: user.data.studyAvailability.getAvailability(Weekday.FRIDAY)
            .minutes,
          saturday: user.data.studyAvailability.getAvailability(
            Weekday.SATURDAY,
          ).minutes,
        },
        onboardingComplete: user.data.onboardingComplete,
        imageUrl: user.data.imageUrl,
        imagePath: user.data.imagePath,
        deleted: user.data.deleted,
        frequencySendPerformanceReport:
          user.data.frequencySendPerformanceReport,
      },
    ).exec();
  }

  async registerManyUsers(users: User[]): Promise<void> {
    const userDocuments = users.map((user) => ({
      _id: user.data.id.value,
      email: user.data.email.value,
      name: user.data.name.value,
      courses: user.data.courses.map((c) => ({
        id: c.id.value,
        registrationDate: c.registrationDate.value,
        expirationDate: c.expirationDate.value,
      })),
      phone: user.data.phone?.value,
      cpf: user.data.cpf?.value,
      age: user.data.age,
      jobPosition: user.data.jobPosition,
      preferredStartDate: user.data.preferedStartDate.value,
      role: user.data.role ? user.data.role.value : undefined,
      studyAvailability: {
        sunday: user.data.studyAvailability.getAvailability(Weekday.SUNDAY)
          .minutes,
        monday: user.data.studyAvailability.getAvailability(Weekday.MONDAY)
          .minutes,
        tuesday: user.data.studyAvailability.getAvailability(Weekday.TUESDAY)
          .minutes,
        wednesday: user.data.studyAvailability.getAvailability(
          Weekday.WEDNESDAY,
        ).minutes,
        thursday: user.data.studyAvailability.getAvailability(Weekday.THURSDAY)
          .minutes,
        friday: user.data.studyAvailability.getAvailability(Weekday.FRIDAY)
          .minutes,
        saturday: user.data.studyAvailability.getAvailability(Weekday.SATURDAY)
          .minutes,
      },
      onboardingComplete: user.data.onboardingComplete,
      imageUrl: user.data.imageUrl,
      imagePath: user.data.imagePath,
      frequencySendPerformanceReport: user.data.frequencySendPerformanceReport,
    }));

    await UserModel.insertMany(userDocuments);
  }

  async ofId(id: ID): Promise<User | null> {
    const user = await UserModel.findById(id.value).lean().exec();
    if (!user) {
      return null;
    }
    return User.restore({
      id: ID.create(user._id),
      courses: user.courses.map((c) => ({
        id: ID.create(c.id),
        registrationDate: CalendarDate.fromString(c.registrationDate)
          .value as CalendarDate,
        expirationDate: CalendarDate.fromString(c.expirationDate)
          .value as CalendarDate,
      })),
      imagePath: user.imagePath,
      imageUrl: user.imageUrl,
      phone: user.phone ? (Phone.create(user.phone).value as Phone) : undefined,
      email: Email.create(user.email).value as Email,
      name: Name.create(user.name).value as Name,
      age: user.age,
      cpf: user.cpf ? (Cpf.create(user.cpf).value as Cpf) : undefined,
      jobPosition: user.jobPosition,
      onboardingComplete: user.onboardingComplete,
      preferedStartDate: CalendarDate.fromString(user.preferredStartDate)
        .value as CalendarDate,
      studyAvailability: UserStudyAvailability.create(
        new Map([
          [
            Weekday.SUNDAY,
            TimespanInMinutes.create(user.studyAvailability.sunday)
              .value as TimespanInMinutes,
          ],
          [
            Weekday.MONDAY,
            TimespanInMinutes.create(user.studyAvailability.monday)
              .value as TimespanInMinutes,
          ],
          [
            Weekday.TUESDAY,
            TimespanInMinutes.create(user.studyAvailability.tuesday)
              .value as TimespanInMinutes,
          ],
          [
            Weekday.WEDNESDAY,
            TimespanInMinutes.create(user.studyAvailability.wednesday)
              .value as TimespanInMinutes,
          ],
          [
            Weekday.THURSDAY,
            TimespanInMinutes.create(user.studyAvailability.thursday)
              .value as TimespanInMinutes,
          ],
          [
            Weekday.FRIDAY,
            TimespanInMinutes.create(user.studyAvailability.friday)
              .value as TimespanInMinutes,
          ],
          [
            Weekday.SATURDAY,
            TimespanInMinutes.create(user.studyAvailability.saturday)
              .value as TimespanInMinutes,
          ],
        ]),
      ),
      role: user.role ? (Role.create(user.role).value as Role) : undefined,
      deleted: false,
      frequencySendPerformanceReport: user.frequencySendPerformanceReport,
    }).value;
  }
}
