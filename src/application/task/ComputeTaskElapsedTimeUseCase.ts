import { UnauthorizedTaskManipulation } from '../../errors/UnauthorizedTaskManipulation.js';
import { TaskNotFoundError } from '../../errors/TaskNotFoundError.js';
import { TaskRepository } from '../../domain/task/TaskRepository.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { UseCase } from '../../shared/UseCase.js';
import { ID } from '../../domain/Id.js';
import { ElapsedTimeInSeconds } from '../../domain/task/ElapsedTimeInSeconds.js';

type ComputeTaskElapsedTimeUseCaseProps = {
  requesterId: ID;
  taskId: ID;
  elapsedTime: ElapsedTimeInSeconds;
};

export class ComputeTaskElapsedTimeUseCase implements UseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(
    data: ComputeTaskElapsedTimeUseCaseProps,
  ): Promise<
    Either<TaskNotFoundError | UnauthorizedTaskManipulation, { id: ID }>
  > {
    const task = await this.taskRepository.ofId(data.taskId);
    if (task === null) {
      return left(new TaskNotFoundError(data.taskId.value));
    }

    const resultOrError = task.setElapsedTime(
      data.requesterId,
      data.elapsedTime,
    );

    if (resultOrError.isLeft()) {
      return left(resultOrError.value);
    }

    await this.taskRepository.save(task);

    return right({ id: data.taskId });
  }
}
