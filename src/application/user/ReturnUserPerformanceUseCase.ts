import type { CourseRepository } from '../../domain/course/CourseRepository.js';
import { ID } from '../../domain/Id.js';
import type { Subject } from '../../domain/subject/Subject.js';
import type { SubjectRepository } from '../../domain/subject/SubjectRepository.js';
import type { Task } from '../../domain/task/Task.js';
import type { User } from '../../domain/user/User.js';
import type { UserRepository } from '../../domain/user/UserRepository.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { TaskQuery } from '../../infrastructure/database/mongoose/TaskQuery.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

/**
 * Interfaces for the final performance object
 */
interface TopicProps {
  questions: number;
  correct: number;
  incorrect: number;
  progress: number;
}

interface SubjectProps {
  questions: number;
  correct: number;
  incorrect: number;
  progress: number;
  topics: Record<string, TopicProps>;
}

interface CourseProps {
  questions: number;
  correct: number;
  incorrect: number;
  progress: number;
  subjects: Record<string, SubjectProps>;
}

export interface UserPerformance {
  name: string;
  email: string;
  phone: string;
  courses: Record<string, CourseProps>;
}

export class ReturnUserPerformanceUseCase implements UseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository,
    private readonly subjectRepository: SubjectRepository,
    private readonly taskQuery: TaskQuery,
  ) {}

  private updateCourseStats(performance: UserPerformance, courseName: string) {
    if (!performance.courses[courseName]) {
      performance.courses[courseName] = {
        questions: 0,
        correct: 0,
        incorrect: 0,
        progress: 0,
        subjects: {},
      };
    }
  }

  private updateSubjectStats(
    performance: UserPerformance,
    courseName: string,
    subjectName: string,
  ) {
    const course = performance.courses[courseName];
    if (!course.subjects[subjectName]) {
      course.subjects[subjectName] = {
        questions: 0,
        correct: 0,
        incorrect: 0,
        progress: 0,
        topics: {},
      };
    }
  }

  private updateTopicStats(
    performance: UserPerformance,
    courseName: string,
    subjectName: string,
    topicName: string,
  ) {
    const subject = performance.courses[courseName].subjects[subjectName];
    if (!subject.topics[topicName]) {
      subject.topics[topicName] = {
        questions: 0,
        correct: 0,
        incorrect: 0,
        progress: 0,
      };
    }
  }

  private calculateProgress(performance: UserPerformance) {
    for (const courseName in performance.courses) {
      const course = performance.courses[courseName];

      course.correct = 0;
      course.incorrect = 0;

      for (const subjectName in course.subjects) {
        const subject = course.subjects[subjectName];

        subject.correct = 0;
        subject.incorrect = 0;

        for (const topicName in subject.topics) {
          const topic = subject.topics[topicName];

          topic.questions = topic.correct + topic.incorrect;
          topic.progress =
            topic.questions > 0 ? topic.correct / topic.questions : 0;

          subject.correct += topic.correct;
          subject.incorrect += topic.incorrect;
        }

        subject.questions = subject.correct + subject.incorrect;
        subject.progress =
          subject.questions > 0 ? subject.correct / subject.questions : 0;

        course.correct += subject.correct;
        course.incorrect += subject.incorrect;
      }

      course.questions = course.correct + course.incorrect;
      course.progress =
        course.questions > 0 ? course.correct / course.questions : 0;
    }
  }

  private async getSubjectsRecord(
    tasks: Task[],
  ): Promise<Record<string, Subject>> {
    const topicIds = [...new Set(tasks.map((t) => t.data.topicId.value))];
    const subjectsRecord = await this.subjectRepository.ofTopicIds(topicIds);

    const finalRecord: Record<string, Subject> = {};

    for (const [topicId, subjectOrNull] of Object.entries(subjectsRecord)) {
      if (subjectOrNull) {
        finalRecord[topicId] = subjectOrNull;
      }
    }

    return finalRecord;
  }

  private async getCoursesMap(user: User): Promise<Record<string, string>> {
    const courseIds = user.data.courses.map((c) => c.id);
    const courses = await this.courseRepository.ofIds(courseIds);

    return courses.reduce((acc: Record<string, string>, course) => {
      if (course?.data?._id?.value && course?.data?.name) {
        acc[course.data._id.value] = course.data.name;
      }
      return acc;
    }, {});
  }

  async execute(
    userId: ID,
  ): Promise<Either<UserNotFoundError, UserPerformance>> {
    const [user, tasks] = await Promise.all([
      this.userRepository.ofId(userId),
      this.taskQuery.ofUser(userId),
    ]);

    if (!user) {
      return left(new UserNotFoundError());
    }

    // Mapeia topicId -> Subject e courseId -> courseName
    const [subjectsRecord, coursesMap] = await Promise.all([
      this.getSubjectsRecord(tasks),
      this.getCoursesMap(user),
    ]);

    const performance: UserPerformance = {
      name: user.data.name.value,
      email: user.data.email.value,
      phone: user.data.phone?.value ?? '',
      courses: {},
    };

    for (const task of tasks) {
      const courseId = task.data.courseId.value;
      const topicId = task.data.topicId.value;

      const courseName = coursesMap[courseId];
      if (!courseName) continue;

      const subject = subjectsRecord[topicId];
      if (!subject) continue;
      const subjectName = subject.data.name.value;

      const foundTopic = subject.data.topics.find(
        (t) => t.id.value === topicId,
      );
      if (!foundTopic) continue;
      const topicName = foundTopic.name.value;

      this.updateCourseStats(performance, courseName);
      this.updateSubjectStats(performance, courseName, subjectName);
      this.updateTopicStats(performance, courseName, subjectName, topicName);

      // Soma correct e incorrect
      const correct = task.data.note?.data.correctCount?.value ?? 0;
      const incorrect = task.data.note?.data.incorrectCount?.value ?? 0;
      const topicRef =
        performance.courses[courseName].subjects[subjectName].topics[topicName];

      topicRef.correct += correct;
      topicRef.incorrect += incorrect;
    }

    this.calculateProgress(performance);

    return right(performance);
  }
}
