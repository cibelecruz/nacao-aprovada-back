import type { User } from '../../domain/user/User.js';
import { MongooseCourseQuery } from '../../infrastructure/database/mongoose/MongooseCourseQuery.js';
import type { UseCase } from '../../shared/UseCase.js';
import { left, right, type Either } from '../../shared/utils/Either.js';

interface SubjectProps {
  subjectName: string;
  subjectId: string;
}

export class FetchAllSubjectsUseCase implements UseCase {
  async execute(user: User): Promise<Either<[], SubjectProps[]>> {
    const courseQuery = new MongooseCourseQuery();

    const subjectsList: SubjectProps[] = [];
    const subjectIds = new Set<string>();

    for (const course of user.data.courses) {
      const courseInfo = await courseQuery.courseInfo(course.id);
      if (!courseInfo) {
        continue;
      }

      const subjects = courseInfo.subjects
        .filter((s) => s.name !== undefined)
        .map((s) => ({
          subjectName: s.name!,
          subjectId: s.id,
        }));

      subjects.forEach((subject) => {
        if (!subjectIds.has(subject.subjectId)) {
          subjectIds.add(subject.subjectId);
          subjectsList.push(subject);
        }
      });
    }

    if (subjectsList.length === 0) {
      return left([]);
    }

    return right(subjectsList);
  }
}
