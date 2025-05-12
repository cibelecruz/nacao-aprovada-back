import type { UUID } from 'crypto';
import type { CourseRepository } from '../../domain/course/CourseRepository.js';
import { ID } from '../../domain/Id.js';
import type { SubjectRepository } from '../../domain/subject/SubjectRepository.js';
import type { UserRepository } from '../../domain/user/UserRepository.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { TaskQuery } from '../../infrastructure/database/mongoose/TaskQuery.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

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

export class GetAllStudentPerformanceUseCase implements UseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly courseRepository: CourseRepository,
    private readonly subjectRepository: SubjectRepository,
    private readonly taskQuery: TaskQuery,
  ) {}

  private updateCourseStats(perf: UserPerformance, courseName: string) {
    if (!perf.courses[courseName]) {
      perf.courses[courseName] = {
        questions: 0,
        correct: 0,
        incorrect: 0,
        progress: 0,
        subjects: {},
      };
    }
  }

  private updateSubjectStats(
    perf: UserPerformance,
    courseName: string,
    subjectName: string,
  ) {
    const course = perf.courses[courseName];
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
    perf: UserPerformance,
    courseName: string,
    subjectName: string,
    topicName: string,
  ) {
    const subject = perf.courses[courseName].subjects[subjectName];
    if (!subject.topics[topicName]) {
      subject.topics[topicName] = {
        questions: 0,
        correct: 0,
        incorrect: 0,
        progress: 0,
      };
    }
  }

  private calculateAllProgress(perf: UserPerformance) {
    for (const courseName in perf.courses) {
      const course = perf.courses[courseName];
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

  /**
   * Main aggregator
   */
  async execute(
    userId: ID,
  ): Promise<Either<UserNotFoundError, UserPerformance>> {
    // 1) Verifica se usuário existe
    const user = await this.userRepository.ofId(userId);
    if (!user) {
      return left(new UserNotFoundError());
    }

    // 2) Agrega direto no Mongo (já vem { _id: {courseId, topicId}, correct, incorrect })
    const tasksAggregated =
      await this.taskQuery.aggregatePerformanceExcludingUser(userId);

    // Se não tiver nada
    if (!tasksAggregated.length) {
      return right({
        name: 'All Students (Aggregated)',
        email: '',
        phone: '',
        courses: {},
      });
    }

    // 3) Extrai todos os IDs
    const courseIdSet = new Set<string>();
    const topicIdSet = new Set<string>();
    for (const agg of tasksAggregated) {
      courseIdSet.add(agg._id.courseId);
      topicIdSet.add(agg._id.topicId);
    }

    // 4) Busca todos os cursos
    const courseIdsArray = [...courseIdSet].map((idStr) =>
      ID.create(idStr as UUID),
    );
    const allCourses = await this.courseRepository.ofIds(courseIdsArray);

    // Mapeia courseId → courseName
    const courseMap = new Map<string, string>();
    for (const c of allCourses) {
      if (c?.data?._id?.value && c?.data?.name) {
        courseMap.set(c.data._id.value, c.data.name);
      }
    }

    // 5) Busca subjects correspondentes a cada topicId
    // subjectRepository.ofTopicIds retorna { [topicId: string]: Subject }
    const topicsArray = [...topicIdSet];
    const subjectsRecord = await this.subjectRepository.ofTopicIds(topicsArray);

    // 6) Monta aggregator
    const aggregatedPerformance: UserPerformance = {
      name: 'All Students (Aggregated)',
      email: '',
      phone: '',
      courses: {},
    };

    // 7) Itera nos resultados agregados (bem menos docs) para preencher aggregator
    for (const agg of tasksAggregated) {
      const { courseId, topicId } = agg._id;

      // A) Nome do curso
      const courseName = courseMap.get(courseId);
      if (!courseName) continue;

      // B) Subject e topic
      const subject = subjectsRecord[topicId];
      if (!subject) continue;
      const subjectName = subject.data.name.value;

      // Encontra o tópico
      const foundTopic = subject.data.topics.find(
        (t) => t.id.value === topicId,
      );
      if (!foundTopic) continue;

      const topicName = foundTopic.name.value;

      // C) Atualiza aggregator
      this.updateCourseStats(aggregatedPerformance, courseName);
      this.updateSubjectStats(aggregatedPerformance, courseName, subjectName);
      this.updateTopicStats(
        aggregatedPerformance,
        courseName,
        subjectName,
        topicName,
      );

      // Soma correct/incorrect
      const topicRef =
        aggregatedPerformance.courses[courseName].subjects[subjectName].topics[
          topicName
        ];
      topicRef.correct += agg.correct;
      topicRef.incorrect += agg.incorrect;
    }

    // 8) Calcula progress
    this.calculateAllProgress(aggregatedPerformance);

    return right(aggregatedPerformance);
  }
}
