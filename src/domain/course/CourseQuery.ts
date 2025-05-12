import { ID } from '../Id.js';

export type SubjectQueryResult = {
  id: string;
  name: string;
  relevance: number;
  active: boolean;
  topics: {
    id: string;
    name: string;
    active: boolean;
    relevance: number;
    taskType: string[];
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

export interface CourseQuery {
  byTopicId(topicId: ID): Promise<{ id: string; name: string }[]>;
  subjects(courseId: ID): Promise<SubjectQueryResult[] | null>;
  listNames(): Promise<{ id: string; name: string }[]>;
  courseInfo(courseId: ID): Promise<CourseQueryReturn | null>
}
