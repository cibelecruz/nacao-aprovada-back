import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';
import { ID } from '../../domain/Id.js';
import { CommentNote } from '../../domain/taskNote/CommentNote.js';
import { QuestionResultNote } from '../../domain/taskNote/QuestionResultNote.js';
import { TaskRepository } from '../../domain/task/TaskRepository.js';
import { TaskNotFoundError } from '../../errors/TaskNotFoundError.js';

type TaskNoteData = {
  taskId: ID;
  commentNote?: CommentNote;
  correctCount?: QuestionResultNote;
  incorrectCount?: QuestionResultNote;
};

export class CreateOrUpdateTaskNoteUseCase implements UseCase {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(
    userId: ID,
    taskNoteData: TaskNoteData,
  ): Promise<Either<Error, undefined>> {
    const task = await this.taskRepository.ofId(taskNoteData.taskId);

    if (!task) {
      return left(new TaskNotFoundError(taskNoteData.taskId.value));
    }

    const taskNoteOrError = task.registerNote(userId, taskNoteData);
    if (taskNoteOrError.isLeft()) {
      return left(taskNoteOrError.value);
    }

    await this.taskRepository.save(task);

    return right(undefined);
  }
}
