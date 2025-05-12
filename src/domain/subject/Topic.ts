import { ID } from '../Id.js';
import { TaskType } from '../task/Task.js';
import { TaskType as TaskTypeClass } from '../task/TaskType.js';
import { SubjectName } from './SubjectName.js';

export class Topic {
  id: ID;
  active: boolean;
  name: SubjectName;
  taskTypes: TaskType[];

  constructor(
    id: ID,
    active: boolean,
    name: SubjectName,
    taskTypes: TaskType[],
  ) {
    this.id = id;
    this.active = active;
    this.name = name;
    this.taskTypes = taskTypes;
  }

  isEqualTo(aTopic: Topic): boolean {
    return this.id === aTopic.id && this.name === aTopic.name;
  }

  static create({
    id,
    active,
    name,
    taskTypes,
  }: {
    id: ID;
    active: boolean;
    name: SubjectName;
    taskTypes: TaskTypeClass[];
  }) {
    return new Topic(
      id,
      active,
      name,
      taskTypes.map((t) => t.value),
    );
  }
}
