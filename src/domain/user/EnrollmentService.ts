import { CourseNotFoundError } from '../../errors/CourseNotFoundError.js';
import { UserAlreadyEnrolledInCourse } from '../../errors/UserAlreadyEnrolledInCourseError.js';
import type { UserNotEnrolledError } from '../../errors/UserNotEnrolledError.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { CalendarDate } from '../CalendarDate.js';
import { ID } from '../Id.js';
import { CourseRepository } from '../course/CourseRepository.js';
import { Task } from '../task/Task.js';
import { TaskRepository } from '../task/TaskRepository.js';
import { UserRepository } from './UserRepository.js';
import { UserSubjectsStatus } from './userSubjectsStatus/UserSubjectsStatus.js';
import { UserSubjectsStatusRepository } from './userSubjectsStatus/UserSubjectsStatusRepository.js';

function filterTasksThatAlreadyExistsByTopic(
  studyTasks: Task[],
  topicsThatHaveTasksForUser: ID[],
) {
  const topicsListOfString = topicsThatHaveTasksForUser.map(
    (topic) => topic.value,
  );
  return studyTasks.filter(
    (task) => !topicsListOfString.includes(task.data.topicId.value),
  );
}

export class EnrollmentService {
  constructor(
    private userRepository: UserRepository,
    private courseRepository: CourseRepository,
    private taskRepository: TaskRepository,
    private userSubjectsStatusRepository: UserSubjectsStatusRepository,
  ) {}

  async unenrollUser(
    userId: ID,
    courseId: ID,
  ): Promise<
    Either<
      UserNotFoundError | CourseNotFoundError | UserNotEnrolledError,
      undefined
    >
  > {
    const user = await this.userRepository.ofId(userId);
    if (!user) {
      return left(new UserNotFoundError());
    }

    const course = await this.courseRepository.ofId(courseId);
    if (!course) {
      return left(new CourseNotFoundError());
    }

    try {
      user.unenroll(courseId);
      await this.taskRepository.deleteByUserAndCourse(userId, courseId);

      await this.userSubjectsStatusRepository.delete(userId, courseId);

      await this.userRepository.save(user);

      return right(undefined);
    } catch (error) {
      return left(new Error('Failed to unenroll user'));
    }
  }

  async unrollAllUsersFromCourseId(
    courseId: ID,
  ): Promise<Either<CourseNotFoundError, undefined>> {
    const course = await this.courseRepository.ofId(courseId);
    if (!course) {
      return left(new CourseNotFoundError());
    }

    const users = await this.userRepository.listStudentsByCourse(
      course.data._id,
    );

    for (const user of users) {
      try {
        user.unenroll(courseId);
        await this.taskRepository.deleteByUserAndCourse(user.data.id, courseId);
        await this.userSubjectsStatusRepository.delete(user.data.id, courseId);
        await this.userRepository.save(user);
      } catch (error) {
        return left(new Error('Failed to unenroll user'));
      }
    }

    return right(undefined);
  }

  async enrollUser(
    userId: ID,
    courseId: ID,
    registrationDate: CalendarDate,
    expirationDate: CalendarDate,
  ): Promise<
    Either<
      UserNotFoundError | CourseNotFoundError | UserAlreadyEnrolledInCourse,
      undefined
    >
  > {
    const user = await this.userRepository.ofId(userId);
    if (!user) {
      return left(new UserNotFoundError());
    }

    const course = await this.courseRepository.ofId(courseId);
    if (!course) {
      return left(new CourseNotFoundError());
    }

    const result = user.enroll(
      course.data._id,
      registrationDate,
      expirationDate,
    );

    if (result.isLeft()) {
      return left(result.value);
    }

    const topicsThatHaveTasksForUser =
      await this.taskRepository.topicsThatHaveTasks(user.data.id);

    const studyTasks = course.data.subjects.flatMap((subject) =>
      subject.topics.map(
        (topic) =>
          Task.create({
            ownerId: user.data.id,
            topicId: topic.id,
            finished: false,
            courseId,
          }).value,
      ),
    );

    const studyTasksFiltered = filterTasksThatAlreadyExistsByTopic(
      studyTasks,
      topicsThatHaveTasksForUser,
    );

    const userSubjectsStatus = UserSubjectsStatus.create({
      userId: user.data.id,
      courseId: course.data._id,
    });

    if (userSubjectsStatus.isLeft()) {
      return left(userSubjectsStatus.value);
    }
    await this.userSubjectsStatusRepository.create(userSubjectsStatus.value);

    for (const task of studyTasksFiltered) {
      await this.taskRepository.create(task);
    }
    await this.userRepository.save(user);
    return right(undefined);
  }
}
