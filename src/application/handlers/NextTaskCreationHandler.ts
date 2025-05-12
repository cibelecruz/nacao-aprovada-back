import { TaskCompletedEvent } from '../../domain/events/TaskCompletedEvent.js';
import { TaskCreationService } from '../../domain/task/TaskCreationService.js';

export class NextTaskCreationHandler {
  constructor(private readonly taskCreationService: TaskCreationService) {}
  async handle(event: TaskCompletedEvent): Promise<void> {
    await this.taskCreationService.execute(event.data);
  }
}
