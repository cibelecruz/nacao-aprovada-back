import { SubjectNotFoundError } from '../../errors/SubjectNotFoundError.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { ID } from '../Id.js';
import { CourseName } from './CourseName.js';

type CourseTopics = {
  id: ID;
  relevance: number;
  active: boolean;
};

type CourseSubject = {
  id: ID;
  active: boolean;
  relevance: number;
  topics: CourseTopics[];
};

type CourseData = {
  _id: ID;
  name: string;
  subjects: CourseSubject[];
  deleted?: boolean;
};

export class Course {
  private constructor(private _data: CourseData) {}

  addSubject(subject: CourseSubject) {
    const subjectIndex = this._data.subjects.findIndex(
      (s) => s.id.value === subject.id.value,
    );
    if (subjectIndex === -1) {
      this._data.subjects.push(subject);
    } else {
      this._data.subjects[subjectIndex] = subject;
    }
  }

  importSubjects(course: Course) {
    this._data.subjects = [];
    this._data.subjects.push(...course.data.subjects);
  }

  delete() {
    this._data.deleted = true;
  }

  updateTopicStatus(course: Course, idTopic: ID, active: boolean) {
    this._data.subjects = course.data.subjects.map((subject) => {
      subject.topics = subject.topics.map((topic) => {
        if (topic.id.value === idTopic.value) {
          topic.active = active;
        }
        return topic;
      });
      return subject;
    });
  }

  updateTopicRelevance(course: Course, idTopic: ID, relevance: number) {
    this._data.subjects = course.data.subjects.map((subject) => {
      subject.topics = subject.topics.map((topic) => {
        if (topic.id.value === idTopic.value) {
          topic.relevance = relevance;
        }
        return topic;
      });
      return subject;
    });
  }

  updateSubjectRelevance(
    subjectId: ID,
    relevance: number,
  ): Either<SubjectNotFoundError, void> {
    const subject = this._data.subjects.find((v) => v.id.equals(subjectId));

    if (!subject) {
      return left(new SubjectNotFoundError());
    }

    subject.relevance = relevance;
    return right(undefined);
  }

  updateName(newName: CourseName) {
    this._data.name = newName.value;
  }

  get data() {
    return this._data;
  }

  static create(data: CourseData) {
    return new Course(data);
  }
}
