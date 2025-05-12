import { DomainEvent } from "../../shared/DomainEvent.js";
import { Task } from "../task/Task.js";


export class TaskCompletedEvent extends DomainEvent {
  static eventName = "TaskCompleted";
  constructor(public data: Task) {
    super("TaskCompleted");
    this.data = data;
  }
}