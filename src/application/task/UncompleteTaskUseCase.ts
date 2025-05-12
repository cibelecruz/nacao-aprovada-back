import { UnauthorizedTaskManipulation } from '../../errors/UnauthorizedTaskManipulation.js';
import { TaskNotFoundError } from '../../errors/TaskNotFoundError.js';
import { TaskRepository } from '../../domain/task/TaskRepository.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { UseCase } from '../../shared/UseCase.js';
import { ID } from '../../domain/Id.js';
import { TaskAlreadyIsIncompleteError } from '../../errors/TaskAlreadyIsIncompleteError.js';

type UncompleteTaskProps = {
  requesterId: ID;
  taskId: ID;
};

export class UncompleteTaskUseCase implements UseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(
    data: UncompleteTaskProps,
  ): Promise<
    Either<TaskNotFoundError | UnauthorizedTaskManipulation, { id: ID }>
  > {
    const task = await this.taskRepository.ofId(data.taskId);
    if (task === null) {
      return left(new TaskNotFoundError(data.taskId.value));
    }

    const taskIsCompleted = task.isCompleted();
    if (!taskIsCompleted) {
      return left(new TaskAlreadyIsIncompleteError());
    }
    const completeResult = task.uncomplete(data.requesterId)
    if(completeResult.isLeft()) {
      return left(completeResult.value)
    }

    await this.taskRepository.save(task);
    return right({ id: data.taskId });
  }
}
