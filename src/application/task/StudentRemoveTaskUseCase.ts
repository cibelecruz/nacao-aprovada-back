import { UnauthorizedTaskManipulation } from '../../errors/UnauthorizedTaskManipulation.js';
import { TaskNotFoundError } from '../../errors/TaskNotFoundError.js';
import { TaskRepository } from '../../domain/task/TaskRepository.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { UseCase } from '../../shared/UseCase.js';
import { ID } from '../../domain/Id.js';

type UncompleteTaskProps = {
  requesterId: ID;
  taskId: ID;
};

export class StudentRemoveTaskUseCase implements UseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(
    data: UncompleteTaskProps,
  )
  : Promise<
    Either<TaskNotFoundError | UnauthorizedTaskManipulation, undefined>
  >
  {
    const task = await this.taskRepository.ofId(data.taskId);
    if (task === null) {
      return left(new TaskNotFoundError(data.taskId.value));
    }

    const result = task.studentRemove(data.requesterId)

    if(result.isLeft()) {
      return left(result.value)
    }

    await this.taskRepository.delete(task.data.id)

    return right(undefined);
  }
}
