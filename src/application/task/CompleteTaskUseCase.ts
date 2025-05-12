import { UnauthorizedTaskManipulation } from '../../errors/UnauthorizedTaskManipulation.js';
import { TaskNotFoundError } from '../../errors/TaskNotFoundError.js';
import { TaskRepository } from '../../domain/task/TaskRepository.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { UseCase } from '../../shared/UseCase.js';
import { ID } from '../../domain/Id.js';
import { ElapsedTimeInSeconds } from '../../domain/task/ElapsedTimeInSeconds.js';

type CompleteTaskProps = {
  requesterId: ID;
  taskId: ID;
  elapsedTimeInSeconds?: ElapsedTimeInSeconds;
};

export class CompleteTaskUseCase implements UseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(
    data: CompleteTaskProps,
  ): Promise<
    Either<TaskNotFoundError | UnauthorizedTaskManipulation, { id: ID }>
  > {
    const task = await this.taskRepository.ofId(data.taskId);
    if (task === null) {
      return left(new TaskNotFoundError(data.taskId.value));
    }

    const completeResult = task.complete(data.requesterId);
    if (completeResult.isLeft()) {
      return left(completeResult.value);
    }

    if (data.elapsedTimeInSeconds) {
      const setElapsedTimeResult = task.setElapsedTime(
        data.requesterId,
        data.elapsedTimeInSeconds,
      );
      if (setElapsedTimeResult.isLeft()) {
        return left(setElapsedTimeResult.value);
      }
    }

    await this.taskRepository.save(task);

    return right({ id: data.taskId });
  }
}
