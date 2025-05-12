import { FastifyRequest } from 'fastify';
import {
  HttpResponse,
  BadRequest,
  InternalServerError,
  OK,
} from '../../utils/responseHelpers.js';
import { QuestionResultNote } from '../../../../domain/taskNote/QuestionResultNote.js';
import { CommentNote } from '../../../../domain/taskNote/CommentNote.js';
import { ID } from '../../../../domain/Id.js';
import { CreateOrUpdateTaskNoteUseCase } from '../../../../application/taskNote/CreateOrUpdateTaskNoteUseCase.js';

type TaskNoteRequestBody = {
  taskId: string;
  note?: string;

  correctCount?: number;
  incorrectCount?: number;
};

type TaskNoteControllerUseCases = {
  createOrupdateTaskNoteUseCase: CreateOrUpdateTaskNoteUseCase;
};

export class TaskNoteController {
  constructor(private readonly useCases: TaskNoteControllerUseCases) {}

  createTaskNote = async (request: FastifyRequest): Promise<HttpResponse> => {
    try {
      const user = request.user;
      const taskNoteData = request.body as TaskNoteRequestBody;

      if (!taskNoteData) {
        return BadRequest(new Error('Missing required parameters.'));
      }
      if (!taskNoteData.taskId) {
        return BadRequest(new Error('Missing required parameter: taskId'));
      }
      const taskIdOrError = ID.parse(taskNoteData.taskId);

      const correctCountOrError = taskNoteData.correctCount
        ? QuestionResultNote.create(taskNoteData.correctCount)
        : undefined;

      const incorrectCountOrError = taskNoteData.incorrectCount
        ? QuestionResultNote.create(taskNoteData.incorrectCount)
        : undefined;

      const commentNoteOrError = taskNoteData.note
        ? CommentNote.create(taskNoteData.note)
        : undefined;

      if (correctCountOrError && correctCountOrError.isLeft()) {
        return BadRequest(correctCountOrError.value);
      }

      if (incorrectCountOrError && incorrectCountOrError.isLeft()) {
        return BadRequest(incorrectCountOrError.value);
      }

      if (commentNoteOrError && commentNoteOrError.isLeft()) {
        return BadRequest(commentNoteOrError.value);
      }

      if (taskIdOrError.isLeft()) {
        return BadRequest(taskIdOrError.value);
      }

      if (!user.data.id) {
        return BadRequest(new Error('User not found'));
      }

      const taskId = taskIdOrError.value;
      const commentNote = commentNoteOrError?.value;
      const incorrectCount = incorrectCountOrError?.value;
      const correctCount = correctCountOrError?.value;

      const taskNote = {
        taskId,
        commentNote,
        correctCount,
        incorrectCount,
      };

      const result = await this.useCases.createOrupdateTaskNoteUseCase.execute(
        user.data.id,
        taskNote,
      );

      if (result.isLeft()) {
        return InternalServerError();
      }

      return OK(result.value);
    } catch (error) {
      console.error(error);
      return InternalServerError();
    }
  };
}
