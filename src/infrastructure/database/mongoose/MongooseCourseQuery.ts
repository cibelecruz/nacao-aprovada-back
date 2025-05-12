import { ID } from '../../../domain/Id.js';
import { CourseQuery } from '../../../domain/course/CourseQuery.js';
import { CourseModel } from './models/CourseModel.js';

type CourseAggregateResultForSubjects = {
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
    deleted?: boolean;
    topics: {
      id: string;
      active: boolean;
      name: string;
      taskTypes: string[];
    }[];
  }[];
};

type CourseAggregateResultForCourseInfo = {
  _id: string;
  name: string;
  subjects: {
    id: string;
    name?: string;
    relevance: number;
    active: boolean;
    topics: {
      id: string;
      name?: string;
      active: boolean;
      relevance: number;
      taskTypes: string[];
    }[];
  }[];
  subjectsOriginal: {
    _id: string;
    name: string;
    deleted?: boolean;
    topics: {
      name: string;
      id: string;
      active: boolean;
      taskTypes: string[];
    }[];
  }[];
};

type CourseQueryReturn = {
  _id: string;
  name: string;
  subjects: {
    id: string;
    name?: string;
    relevance: number;
    active: boolean;
    topics: {
      id: string;
      name?: string;
      active: boolean;
      relevance: number;
      taskTypes: string[];
    }[];
  }[];
};

export class MongooseCourseQuery implements CourseQuery {
  async byTopicId(topicId: ID): Promise<{ id: string; name: string }[]> {
    const courses = await CourseModel.find(
      { 'subjects.topics.id': topicId.value },
      { name: 1 },
    )
      .lean()
      .exec();
    return courses.map((course) => ({
      id: course._id,
      name: course.name,
    }));
  }

  async subjects(courseId: ID) {
    const courseData =
      await CourseModel.aggregate<CourseAggregateResultForSubjects>()
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

    const topicTaskTypes = new Map(
      courseData[0].subjectsFromSubjectsCollection.flatMap((subject) =>
        subject.topics.map((topic) => [topic.id, topic.taskTypes]),
      ),
    );

    return courseData[0].subjects.map((subject) => ({
      id: subject.id,
      name: subjectNameMap.get(subject.id) ?? '',
      relevance: subject.relevance,
      active: subject.active,
      topics: subject.topics.map((topic) => ({
        id: topic.id,
        name: topicNameMap.get(topic.id) ?? '',
        active: topic.active,
        relevance: topic.relevance,
        taskType: topicTaskTypes.get(topic.id) ?? [],
      })),
    }));
  }

  async listNames(): Promise<{ id: string; name: string }[]> {
    const courses = await CourseModel.find(
      {
        deleted: {
          $ne: true,
        },
      },
      { name: 1 },
    )
      .lean()
      .exec();
    return courses.map((course) => ({
      id: course._id, // Inclua o ID no retorno
      name: course.name,
    }));
  }

  async courseInfo(courseId: ID): Promise<CourseQueryReturn | null> {
    const courseData =
      await CourseModel.aggregate<CourseAggregateResultForCourseInfo>()
        .match({ _id: courseId.value })
        .lookup({
          from: 'subjects',
          localField: 'subjects.id',
          foreignField: '_id',
          as: 'subjectsOriginal',
        })
        .exec();
    if (!courseData) {
      return null;
    }

    const originalSubjectMap = new Map(
      courseData[0].subjectsOriginal.map((subject) => [subject._id, subject]),
    );
    const originalTopicMap = new Map(
      courseData[0].subjectsOriginal.flatMap((subject) =>
        subject.topics.map((topic) => [topic.id, topic]),
      ),
    );

    // courseData[0].subjects.forEach((subject) => {
    //   const subjectOriginal = courseData[0].subjectsOriginal.find(
    //     (s) => s._id === subject.id,
    //   );
    //   subject.name = subjectOriginal?.name;
    //   subject.topics.forEach((topic) => {
    //     const topicOriginal = subjectOriginal?.topics.find(
    //       (t) => t.id === topic.id,
    //     );
    //     topic.name = topicOriginal?.name;
    //   });
    // });

    const courseDataReturn: CourseQueryReturn = {
      _id: courseData[0]._id,
      name: courseData[0].name,
      subjects: courseData[0].subjects.map((subject) => {
        return {
          id: subject.id,
          name: originalSubjectMap.get(subject.id)?.name,
          relevance: subject.relevance,
          active: subject.active,
          topics: subject.topics.map((topic) => {
            return {
              id: topic.id,
              name: originalTopicMap.get(topic.id)?.name,
              active: topic.active,
              relevance: topic.relevance,
              taskTypes: originalTopicMap.get(topic.id)?.taskTypes ?? [],
            };
          }),
        };
      }),
    };

    return courseDataReturn;
  }
}
