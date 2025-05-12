import { ID } from '../Id.js';
import { TaskType } from '../task/Task.js';
import { SubjectName } from './SubjectName.js';
import { Topic } from './Topic.js';

export interface SubjectData {
  id: ID;
  name: SubjectName;
  topics: Topic[];
  deleted: boolean;
}

export class Subject {
  private constructor(private _data: SubjectData) {}

  get data() {
    return this._data;
  }

  updateName(aNewName: SubjectName) {
    if (this._data.name.isEqualTo(aNewName)) {
      return;
    } 
    this._data.name = aNewName;
  }

  addTopic(aTopic: Topic) {
    if (this._data.topics.find((t) => t.isEqualTo(aTopic))) {
      return;
    }
    this._data.topics.push(aTopic);
  }

  deactivateTopic(topicId: ID) {
    const topic = this._data.topics.find((t) => t.id === topicId);
    if (topic) {
      topic.active = false;
    }
  }

  updateTaskTypeList(topicId: ID, taskTypeList: TaskType[]) {
    const topic = this._data.topics.find((t) => t.id === topicId);
    if (topic) {
      topic.taskTypes = taskTypeList;
    }
  }

  removeTopic(topicId: ID) {
    this._data.topics = this._data.topics.filter((t) => t.id !== topicId);
  }

  setTopics(topics: Topic[]) {
    this._data.topics = topics;
  }

  static create(data: Omit<SubjectData, 'deleted'> & { deleted?: boolean }) {
    return new Subject({ ...data, deleted: data.deleted ?? false });
  }

  delete() {
    this._data.deleted = true;
  }
}
