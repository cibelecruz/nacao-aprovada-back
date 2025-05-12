import { TaskCompletedEvent } from '../../domain/events/TaskCompletedEvent.js';
import { TaskNoteRegisteredEvent } from '../../domain/events/TaskNoteRegisteredEvent.js';
import { DailyProgressService } from '../analytics/RegisterDailyProgressService.js';

export class AnalyticsDashboardHandler {
  constructor(
    private readonly dailyProgressService: DailyProgressService,
  ) {}
  async handleTaskCompleted(event: TaskCompletedEvent): Promise<void> {
    await this.dailyProgressService.handleTaskCompletion(event.data);
  }
  
  async handleTaskNoteRegistration(event: TaskNoteRegisteredEvent): Promise<void> {
    await this.dailyProgressService.handleTaskNoteRegistration(event.data);
  }
}
