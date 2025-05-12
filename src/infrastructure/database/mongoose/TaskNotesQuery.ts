import { ID } from '../../../domain/Id.js';
import { TaskModel } from './models/TaskModel.js';

export class TaskNotesQuery {
  async findOne(taskId: ID) {
    try {
      const taskNote = await TaskModel.findById(taskId);
      return taskNote;
    } catch (error) {
      console.error('Error fetching task note:', error);
      throw error;
    }
  }

  async save(taskId: string, note: string) {
    try {
      const newTaskNote = new TaskModel({ taskId, note });
      const savedTaskNote = await newTaskNote.save();

      return savedTaskNote;
    } catch (error) {
      console.error('Error saving task note:', error);
      throw error;
    }
  }
}
