import { UnauthorizedTaskManipulation } from '../../errors/UnauthorizedTaskManipulation.js';
import { TaskRepository } from '../../domain/task/TaskRepository.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { UseCase } from '../../shared/UseCase.js';
import { ID } from '../../domain/Id.js';
import { CalendarDate } from '../../domain/CalendarDate.js';
import { Task, TaskType } from '../../domain/task/Task.js';

type CreateExtraTaskProps = {
  requesterId: ID;
  topicId: ID;
  date: CalendarDate;
  type: TaskType;
  courseId: ID
};

export class CreateExtraTaskUseCase implements UseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(
    data: CreateExtraTaskProps,
  ): Promise<Either<UnauthorizedTaskManipulation, Task>> {
    const taskResult = Task.create({
      ownerId: data.requesterId,
      topicId: data.topicId,
      plannedDate: data.date,
      type: data.type,
      courseId: data.courseId,
      isExtra: true,
    });

    if (taskResult.isLeft()) {
      return left(new UnauthorizedTaskManipulation());
    }

    const task = taskResult.value;

    await this.taskRepository.create(task);

    return right(task);
  }
}
