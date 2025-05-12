import { Either, left, right } from '../../shared/utils/Either.js';
import { Cpf } from './Cpf.js';
import { Email } from './Email.js';
import { ID } from '../Id.js';
import { Name } from './Name.js';
import { Phone } from './Phone.js';
import { CalendarDate } from '../CalendarDate.js';
import { Role } from './Role.js';
import { UserStudyAvailability } from './UserStudyAvailability.js';
import { InvalidPreferredStartDateError } from '../../errors/InvalidPreferredStartDateError.js';
import { UserAlreadyEnrolledInCourse } from '../../errors/UserAlreadyEnrolledInCourseError.js';
import { InsufficientPrivilegesError } from '../../errors/InsufficientPrivilegesError.js';
import { CourseNotFoundError } from '../../errors/CourseNotFoundError.js';

type UserCourse = {
  id: ID;
  registrationDate: CalendarDate;
  expirationDate: CalendarDate;
};

type UserData = {
  id: ID;
  preferedStartDate: CalendarDate;
  studyAvailability: UserStudyAvailability;
  name: Name;
  courses: UserCourse[];
  email: Email;
  age?: number;
  cpf?: Cpf;
  jobPosition?: string;
  phone?: Phone;
  role?: Role;
  onboardingComplete?: boolean;
  imagePath?: string;
  imageUrl?: string;
  deleted?: boolean;
  frequencySendPerformanceReport?: string;
};

type CreateUserDataProps = Omit<
  UserData,
  'id' | 'preferedStartDate' | 'studyAvailability' | 'courses'
> & {
  id?: ID;
  preferedStartDate?: CalendarDate;
  studyAvailability?: UserStudyAvailability;
  courses?: UserCourse[];
};

export class User {
  constructor(private readonly _data: UserData) {}

  get data() {
    return this._data;
  }

  completeOnboarding() {
    this._data.onboardingComplete = true;
  }

  getCurrentCourse(): ID {
    return this._data.courses[0].id;
  }

  updateName(name: Name): void {
    this._data.name = name;
  }

  updateAge(age: number): void {
    this._data.age = age;
  }

  updateUserCourses(coursesInfo: {
    userId: ID;
    courses: {
      id: ID;
      registrationDate: CalendarDate;
      expirationDate: CalendarDate;
    }[];
  }) {
    if (coursesInfo.courses.length > 0) {
      this._data.courses = coursesInfo.courses;
    }
  }
  updateStudentInfo(userInfo: {
    userId: ID;
    email?: Email;
    phone?: Phone;
    course?: {
      id: ID;
      registrationDate: CalendarDate;
      expirationDate: CalendarDate;
    };
  }) {
    if (userInfo.course) {
      this._data.courses = this._data.courses.map((course) => {
        if (course.id.value === userInfo.course?.id.value) {
          return userInfo.course;
        }
        return course;
      });
    }
    if (userInfo.email) {
      this._data.email = userInfo.email;
    }
    if (userInfo.phone) {
      this._data.phone = userInfo.phone;
    }
  }

  delete() {
    this._data.deleted = true;
  }

  uploadImage(imagePath: string, imageUrl: string): void {
    this._data.imagePath = imagePath;
    this._data.imageUrl = imageUrl;
  }

  updateFrequency(frequency: string): void {
    this._data.frequencySendPerformanceReport = frequency;
  }

  deleteImage(): void {
    this._data.imagePath = '';
    this._data.imageUrl = '';
  }

  updateCurrentJobPosition(jobPosition: string): void {
    this._data.jobPosition = jobPosition;
  }

  setPreferredStartDate(
    preferredStartDate: CalendarDate,
  ): Either<InvalidPreferredStartDateError, void> {
    if (preferredStartDate.isBefore(CalendarDate.today())) {
      return left(new InvalidPreferredStartDateError(preferredStartDate));
    }
    this._data.preferedStartDate = preferredStartDate;
    return right(undefined);
  }

  setStudyAvailability(studyAvailability: UserStudyAvailability): void {
    this._data.studyAvailability = studyAvailability;
  }

  promoteTo(
    role: Role,
    requester: User,
  ): Either<InsufficientPrivilegesError, undefined> {
    if (!requester.isSuperAdmin()) {
      return left(new InsufficientPrivilegesError());
    }
    this._data.role = role;
    return right(undefined);
  }

  unenroll(courseId: ID): Either<CourseNotFoundError, undefined> {
    const courseIndex = this.data.courses.findIndex((c) =>
      c.id.equals(courseId),
    );

    if (courseIndex === -1) {
      return left(new CourseNotFoundError());
    }

    this.data.courses.splice(courseIndex, 1);

    return right(undefined);
  }

  enroll(
    courseId: ID,
    registrationDate: CalendarDate,
    expirationDate: CalendarDate,
  ): Either<UserAlreadyEnrolledInCourse, undefined> {
    if (this.isEnrolledInCourse(courseId)) {
      return left(new UserAlreadyEnrolledInCourse());
    }
    this._data.courses.push({ id: courseId, registrationDate, expirationDate });
    return right(undefined);
  }

  isEnrolledInCourse(courseId: ID): boolean {
    return this._data.courses
      .map((c) => c.id.toString())
      .includes(courseId.value);
  }

  isAdmin(): boolean {
    return (
      this._data.role?.value === Role.createAdmin().value || this.isSuperAdmin()
    );
  }

  rollback() {
    this.data.deleted = false;
  }

  isSuperAdmin(): boolean {
    return this._data.role?.value === Role.createSuperAdmin().value;
  }

  toJSON() {
    return {
      id: this._data.id.value,
      preferedStartDate: this._data.preferedStartDate.value,
      studyAvailability: this._data.studyAvailability.toJSON(),
      name: this._data.name.value,
      email: this._data.email.value,
      onboardingComplete: this._data.onboardingComplete,
      age: this._data.age,
      jobPosition: this._data.jobPosition,
    };
  }

  static create(userData: CreateUserDataProps): Either<never, User> {
    const userAvailability =
      userData.studyAvailability ?? UserStudyAvailability.default();

    const preferredStartDate =
      userData.preferedStartDate ?? CalendarDate.today();

    return right(
      new User({
        id: userData.id ?? ID.create(),
        preferedStartDate: preferredStartDate,
        studyAvailability: userAvailability,
        name: userData.name,
        courses: userData.courses ?? [],
        email: userData.email,
        cpf: userData.cpf,
        phone: userData.phone,
        role: userData.role ?? Role.createStudent(),
        onboardingComplete: userData.onboardingComplete,
        age: userData.age,
        jobPosition: userData.jobPosition,
        imagePath: userData.imagePath,
        imageUrl: userData.imageUrl,
        deleted: userData.deleted,
      }),
    );
  }

  static restore(userData: UserData): Either<never, User> {
    return right(
      new User({
        id: userData.id,
        preferedStartDate: userData.preferedStartDate,
        studyAvailability: userData.studyAvailability,
        name: userData.name,
        courses: userData.courses,
        email: userData.email,
        cpf: userData.cpf,
        phone: userData.phone,
        role: userData.role,
        onboardingComplete: userData.onboardingComplete,
        age: userData.age,
        jobPosition: userData.jobPosition,
        imagePath: userData.imagePath,
        imageUrl: userData.imageUrl,
        deleted: userData.deleted,
      }),
    );
  }
}
