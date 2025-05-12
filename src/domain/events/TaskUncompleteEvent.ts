import { DomainEvent } from "../../shared/DomainEvent.js";
import { Task } from "../task/Task.js";


export class TaskUncompleteEvent extends DomainEvent {
  static eventName = "TaskUncompleted";
  constructor(public data: Task) {
    super("TaskUncompleted");
    this.data = data;
  }
}