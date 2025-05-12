import { CourseQuery } from '../../domain/course/CourseQuery.js';
import { ID } from '../../domain/Id.js';
import { TaskType } from '../../domain/task/TaskType.js';
import { UserSubjectsStatusRepository } from '../../domain/user/userSubjectsStatus/UserSubjectsStatusRepository.js';
import { CourseNotFoundError } from '../../errors/CourseNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { isTruthy } from '../../shared/utils/ArrayUtils.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type SubjectList = {
  id: ID;
  active: boolean;
  topics: {
    id: ID;
    active: boolean;
    taskTypes: TaskType[];
  }[];
};

function compareTaskTypes(original: TaskType[], changed: TaskType[]) {
  const originalString = original.map((o) => o.value);
  const changedString = changed.map((c) => c.value);
  const isOriginalEqual = originalString.every((taskType) =>
    changedString.includes(taskType),
  );
  const isChangedEqual = changedString.every((taskType) =>
    originalString.includes(taskType),
  );

  if (!isOriginalEqual || !isChangedEqual) {
    return changed;
  }

  return undefined;
}

function compareTopics(
  original: SubjectList['topics'][number],
  changed: SubjectList['topics'][number],
) {
  if (original.id.value !== changed.id.value) {
    return undefined;
  }

  const activeCustomization =
    original.active !== changed.active ? changed.active : undefined;
  const taskTypesCustomization = compareTaskTypes(
    original.taskTypes,
    changed.taskTypes,
  );

  if (activeCustomization !== undefined || taskTypesCustomization) {
    return {
      topicId: original.id.value,
      ...(activeCustomization !== undefined
        ? { active: activeCustomization }
        : undefined),
      ...(taskTypesCustomization !== undefined
        ? { taskTypes: taskTypesCustomization }
        : undefined),
    };
  }

  return undefined;
}

function compareSubjects(original: SubjectList, changed: SubjectList) {
  if (original.id.value !== changed.id.value) {
    return undefined;
  }

  const changedTopicsMap = new Map(
    changed.topics.map((topic) => [topic.id.value, topic]),
  );

  // Garantindo que 'active' nunca será undefined
  const activeCustomization =
    original.active !== changed.active ? changed.active : original.active;

  const topicsCustomizations = original.topics
    .map((originalTopic) => {
      const changedTopic = changedTopicsMap.get(originalTopic.id.value);
      if (!changedTopic) {
        return undefined;
      }
      return compareTopics(originalTopic, changedTopic);
    })
    .filter((customization) => customization !== undefined)
    .filter(isTruthy);

  if (activeCustomization !== undefined || topicsCustomizations.length) {
    return {
      subjectId: original.id.value,
      active: activeCustomization, // Corrigido para incluir 'active' corretamente
      ...(topicsCustomizations.length
        ? { topicCustomizations: topicsCustomizations }
        : undefined),
    };
  }

  return undefined;
}

function getCustomizationsDiff(
  courseSubjects: SubjectList[],
  changedSubjects: SubjectList[],
) {
  const changedSubjectsMap = new Map(
    changedSubjects.map((subject) => [subject.id.value, subject]),
  );

  const customizations = courseSubjects
    .map((courseSubject) => {
      const changedSubject = changedSubjectsMap.get(courseSubject.id.value);
      if (!changedSubject) {
        return undefined;
      }
      return compareSubjects(courseSubject, changedSubject);
    })
    .filter((customization) => customization !== undefined)
    .filter(isTruthy);

  return customizations;
}

export class RegisterUserSubjectCustomizationsUseCase implements UseCase {
  constructor(
    private readonly courseQuery: CourseQuery,
    private readonly userSubjectStatusRepository: UserSubjectsStatusRepository,
  ) {}

  async execute(
    userId: ID,
    courseId: ID,
    subjects: SubjectList[],
  ): Promise<Either<Error, undefined>> {
    const course = await this.courseQuery.subjects(courseId);
    if (!course) {
      return left(new CourseNotFoundError());
    }

    const mappedCourses = course.map((subject) => {
      return {
        id: ID.parse(subject.id).value as ID,
        active: subject.active,
        topics: subject.topics.map((topic) => {
          return {
            id: ID.parse(topic.id).value as ID,
            active: topic.active,
            taskTypes: topic.taskType.map((taskType) => {
              return TaskType.create(taskType).value as TaskType;
            }),
          };
        }),
      };
    });

    const customizationsDiff = getCustomizationsDiff(mappedCourses, subjects);
    if (customizationsDiff.length === 0) {
      return right(undefined);
    }

    const userSubjectStatus = await this.userSubjectStatusRepository.ofId(
      userId,
      courseId,
    );

    if (!userSubjectStatus) {
      return left(new Error('User subject status not found'));
    }

    for (const customization of customizationsDiff) {
      if (customization?.active !== undefined) {
        userSubjectStatus.addActiveSubjectCustomization(
          ID.parse(customization.subjectId).value as ID,
          customization.active,
        );
      }
      if (customization?.topicCustomizations) {
        for (const topicCustomization of customization.topicCustomizations) {
          userSubjectStatus.addTopicCustomization(
            ID.parse(customization.subjectId).value as ID,
            ID.parse(topicCustomization.topicId).value as ID,
            topicCustomization.active,
            topicCustomization.taskTypes,
          );
        }
      }
    }

    await this.userSubjectStatusRepository.save(userSubjectStatus);

    return right(undefined);
  }
}
