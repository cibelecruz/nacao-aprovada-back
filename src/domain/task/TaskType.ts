import { InvalidTaskTypeError } from "../../errors/InvalidTaskTypeError.js";
import { Either, left, right } from "../../shared/utils/Either.js";

const taskTypes = ["study", "lawStudy", "exercise", "review"] as const;
type TaskTypeValue = typeof taskTypes;

function isOfTaskType(value: string): value is TaskTypeValue[number] {
  return taskTypes.includes(value as TaskTypeValue[number]);
}

export class TaskType {
  private constructor(private readonly _value: TaskTypeValue[number]) {}

  static create(value: string): Either<InvalidTaskTypeError, TaskType> {
    if (!isOfTaskType(value)) {
      return left(new InvalidTaskTypeError(value));
    }
    return right(new TaskType(value));
  }

  get value() {
    return this._value;
  }
}
