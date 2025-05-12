import { ID } from '../../../domain/Id.js';
import { TaskType } from '../../../domain/task/Task.js';
import { CourseModel } from './models/CourseModel.js';
import { UserSubjectsStatusModel } from './models/UserSubjectsStatusModel.js';

type CourseAggregateResult = {
  _id: string;
  subjects: {
    id: string;
    name: string;
    relevance: number;
    active: boolean;
    topics: {
      id: string;
      active: boolean;
      relevance: number;
      taskTypes: string[];
    }[];
  }[];
  subjectsFromSubjectsCollection: {
    _id: string;
    name: string;
    topics: {
      id: string;
      active: boolean;
      name: string;
      taskTypes: string[];
    }[];
  }[];
};


export class UserSubjectsStatusQuery {
  async subjects(userId: ID, courseId: ID) {
    const userData = await UserSubjectsStatusModel.findOne({
      userId: userId.value,
      courseId: courseId.value,
    })
      .lean()
      .exec();

    if (!userData) {
      return null;
    }

    return userData;
  }

  async subjectsPosition(userId: ID, courseId: ID) {
    const userData = await UserSubjectsStatusModel.findOne({
      userId: userId.value,
      courseId: courseId.value,
    })
      .lean()
      .exec();

    const userTopicCustomizationsMap = new Map(
      userData?.customizations.flatMap((sC) => sC.topicCustomizations?.map((tC) => [tC.topicId, tC]) ?? []),
    );

    const userSubjectCustomizationsMap = new Map(
      userData?.customizations.map((sC) => [sC.subjectId, sC]) ?? [],
    );
    
      const courseData = await CourseModel.aggregate<CourseAggregateResult>()
      .match({ _id: courseId.value })
      .lookup({
        from: 'subjects',
        localField: 'subjects.id',
        foreignField: '_id',
        as: 'subjectsFromSubjectsCollection',
      })
      .exec();

    if (!courseData || courseData.length === 0) {
      return null;
    }

    const subjectNameMap = new Map(
      courseData[0].subjectsFromSubjectsCollection.map((subject) => [
        subject._id,
        subject.name,
      ]),
    );

    const topicNameMap = new Map(
      courseData[0].subjectsFromSubjectsCollection.flatMap((subject) =>
        subject.topics.map((topic) => [topic.id, topic.name]),
      ),
    );

    const topicTaskTypesMap = new Map(
      courseData[0].subjectsFromSubjectsCollection.flatMap((subject) =>
        subject.topics.map((topic) => [topic.id, topic.taskTypes]),
      ),
    );

    return courseData[0].subjects.map((subject) => ({
      id: subject.id,
      name: subjectNameMap.get(subject.id) ?? '',
      relevance: subject.relevance,
      active: userSubjectCustomizationsMap.get(subject.id)?.active ?? subject.active,
      topics: subject.topics.map((topic) => ({
        id: topic.id,
        name: topicNameMap.get(topic.id) ?? '',
        active: userTopicCustomizationsMap.get(topic.id)?.active ?? topic.active,
        relevance: topic.relevance,
        taskType: userTopicCustomizationsMap.get(topic.id)?.taskTypes ?? topicTaskTypesMap.get(topic.id) ?? ['study', 'lawStudy', 'exercise', 'review'],
      })),
    }));
    
  }

  async topicPosition(userId: ID, topicId: ID) {
    const courseData = await CourseModel.aggregate<CourseAggregateResult>()
      .match({ 'subjects.topics.id': topicId.value })
      .lookup({
        from: 'subjects',
        localField: 'subjects.id',
        foreignField: '_id',
        as: 'subjectsFromSubjectsCollection',
      })
      .exec();

    if (!courseData || courseData.length === 0) {
      return null;
    }

    const userData = await UserSubjectsStatusModel.findOne({
      userId: userId.value,
      courseId: courseData[0]._id,
    })
      .lean()
      .exec();

    const userTopicCustomizationsMap = new Map(
      userData?.customizations.flatMap((sC) => sC.topicCustomizations?.map((tC) => [tC.topicId, tC]) ?? []),
    );

    const userSubjectCustomizationsMap = new Map(
      userData?.customizations.map((sC) => [sC.subjectId, sC]) ?? [],
    );

    const subjectNameMap = new Map(
      courseData[0].subjectsFromSubjectsCollection.map((subject) => [
        subject._id,
        subject.name,
      ]),
    );

    const topicNameMap = new Map(
      courseData[0].subjectsFromSubjectsCollection.flatMap((subject) =>
        subject.topics.map((topic) => [topic.id, topic.name]),
      ),
    );

    const topicTaskTypesMap = new Map(
      courseData[0].subjectsFromSubjectsCollection.flatMap((subject) =>
        subject.topics.map((topic) => [topic.id, topic.taskTypes]),
      ),
    );

    const result = courseData[0].subjects.map((subject) => ({
      id: subject.id,
      name: subjectNameMap.get(subject.id) ?? '',
      relevance: subject.relevance,
      active: userSubjectCustomizationsMap.get(subject.id)?.active ?? subject.active,
      topics: subject.topics.map((topic) => ({
        id: topic.id,
        name: topicNameMap.get(topic.id) ?? '',
        active: userTopicCustomizationsMap.get(topic.id)?.active ?? topic.active,
        relevance: topic.relevance,
        taskType: (userTopicCustomizationsMap.get(topic.id)?.taskTypes ?? topicTaskTypesMap.get(topic.id) ?? ['study', 'lawStudy', 'exercise', 'review']) as TaskType[],
      })),
    }));

    return result.flatMap((s) => s.topics).find((t) => t.id === topicId.value) ?? null;
  }
}
