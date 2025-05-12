import { PlannedTask } from '../domain/scheduler/UserSchedule.js';

type LessonMap = Map<
  string,
  {
    title: string;
    subtitle: string;
    relevance: number;
  }
>;

type TaskNoteDto = {
  commentNote?: string;
  correctCount?: number;
  incorrectCount?: number;
};

export class TimelineTasksDto {
  id: string;
  title: string;
  subtitle: string;
  relevance: number;
  description: string;
  taskNote?: TaskNoteDto;
  finished: boolean;
  timeSpent: number;
  plannedDate: string;
  isExtra: boolean;
  taskType: string;
  allowFurtherStudy: boolean;
  allowQuestionsResultInput: boolean;
  minTimeToCompleteInMinutes: number;

  constructor(data: {
    id: string;
    title: string;
    subtitle: string;
    relevance: number;
    taskNote?: TaskNoteDto;
    description: string;
    finished: boolean;
    timeSpent: number;
    plannedDate: string;
    isExtra: boolean;
    taskType: string;
    allowFurtherStudy: boolean;
    allowQuestionsResultInput: boolean;
    minTimeToCompleteInMinutes: number;
  }) {
    this.id = data.id;
    this.title = data.title;
    this.taskNote = data.taskNote;
    this.subtitle = data.subtitle;
    this.relevance = data.relevance;
    this.description = data.description;
    this.finished = data.finished;
    this.timeSpent = data.timeSpent;
    this.plannedDate = data.plannedDate;
    this.isExtra = data.isExtra;
    this.taskType = data.taskType;
    this.allowQuestionsResultInput = data.allowQuestionsResultInput;
    this.allowFurtherStudy = data.allowFurtherStudy;
    this.minTimeToCompleteInMinutes = data.minTimeToCompleteInMinutes;
  }

  static fromDomain(task: PlannedTask, lessonsMap: LessonMap) {
    return new TimelineTasksDto({
      id: task.id.value,
      finished: task.finished,
      plannedDate: task.plannedDate.value,
      taskNote: task.note
        ? {
            commentNote: task.note.data.commentNote?.value,
            correctCount: task.note.data.correctCount?.value,
            incorrectCount: task.note.data.incorrectCount?.value,
          }
        : undefined,
      relevance: lessonsMap.get(task.topicId.value)?.relevance ?? 0,
      timeSpent: task.elapsedTimeInSeconds?.value ?? 0,
      subtitle: lessonsMap.get(task.topicId.value)?.subtitle ?? '',
      title: lessonsMap.get(task.topicId.value)?.title ?? '',
      description: '',
      isExtra: task.isExtra,
      taskType: getTaskTypeName(task.type),
      allowQuestionsResultInput: task.type !== 'study',
      allowFurtherStudy: task.type === 'study',
      minTimeToCompleteInMinutes: task.estimatedTimeToComplete.minutes,
    });
  }
}

function getTaskTypeName(type: string) {
  switch (type) {
    case 'study':
      return 'Estudo Teórico';
    case 'exercise':
      return 'Exercício';
    case 'review':
      return 'Revisão';
    case 'lawStudy':
      return 'Estudo da Lei';
    default:
      return 'Tarefa';
  }
}
