import { UserSubjectsStatusQuery } from '../../infrastructure/database/mongoose/UserSubjectsStatusQuery.js';
import { Task, TaskType } from './Task.js';
import { TaskRepository } from './TaskRepository.js';

const getNextCooldownByCycle = (cycle: number) => {
  const nextExerciseCooldownByCycle = [1, 3, 5];
  const nextLawStudyCooldownByCycle = [1, 3, 7, 14];
  const nextReviewCooldownByCycle = [7, 14, 30, 60];
  const index = cycle > 0 ? cycle - 1 : 0;
  return {
    exercise:
      nextExerciseCooldownByCycle[
        Math.min(index, nextExerciseCooldownByCycle.length - 1)
      ],
    lawStudy:
      nextLawStudyCooldownByCycle[
        Math.min(index, nextLawStudyCooldownByCycle.length - 1)
      ],
    review:
      nextReviewCooldownByCycle[
        Math.min(index, nextReviewCooldownByCycle.length - 1)
      ],
    study: 1,
  } as Record<TaskType, number>;
};
const defaultTaskTypeSequence = new Map([
  [
    'study',
    [
      { type: 'exercise', incrementCycle: true },
      { type: 'review', incrementCycle: true },
    ],
  ],
  ['exercise', []],
  [
    'review',
    [
      { type: 'exercise', incrementCycle: true },
      { type: 'review', incrementCycle: true },
    ],
  ],
]);

function getTaskCycleObjectByTaskConfig(taskTypes: TaskType[]) {
  const includesStudy = taskTypes.includes('study');
  const includesLawStudy = taskTypes.includes('lawStudy');
  const includesExercise = taskTypes.includes('exercise');
  const includesReview = taskTypes.includes('review');

  const includesAll =
    includesStudy && includesLawStudy && includesExercise && includesReview;
  const doesNotIncludeExercise =
    includesStudy && includesLawStudy && !includesExercise && includesReview;
  const doesNotIncludeLawStudy =
    includesStudy && !includesLawStudy && includesExercise && includesReview;
  const doesNotIncludeReview =
    includesStudy && includesLawStudy && includesExercise && !includesReview;
  const doesNotIncludeLawStudyAndReview =
    includesStudy && !includesLawStudy && includesExercise && !includesReview;
  const doesNotIncludeExerciseAndReview =
    includesStudy && includesLawStudy && !includesExercise && !includesReview;
  const doesNotIncludeLawStudyAndExercise =
    includesStudy && !includesLawStudy && !includesExercise && includesReview;

  if (includesAll) {
    return new Map([
      [
        'study',
        [
          { type: 'lawStudy', incrementCycle: true },
          { type: 'review', incrementCycle: true },
        ],
      ],
      ['lawStudy', [{ type: 'exercise', incrementCycle: false }]],
      ['exercise', []],
      [
        'review',
        [
          { type: 'exercise', incrementCycle: true },
          { type: 'review', incrementCycle: true },
        ],
      ],
    ]);
  }

  if (doesNotIncludeLawStudy) {
    return new Map([
      [
        'study',
        [
          { type: 'exercise', incrementCycle: true },
          { type: 'review', incrementCycle: true },
        ],
      ],
      ['exercise', []],
      [
        'review',
        [
          { type: 'exercise', incrementCycle: true },
          { type: 'review', incrementCycle: true },
        ],
      ],
    ]);
  }

  if (doesNotIncludeExercise) {
    return new Map([
      [
        'study',
        [
          { type: 'lawStudy', incrementCycle: true },
          { type: 'review', incrementCycle: true },
        ],
      ],
      ['lawStudy', []],
      [
        'review',
        [
          { type: 'exercise', incrementCycle: true },
          { type: 'review', incrementCycle: true },
        ],
      ],
    ]);
  }

  if (doesNotIncludeReview) {
    return new Map([
      ['study', [{ type: 'lawStudy', incrementCycle: true }]],
      ['lawStudy', [{ type: 'exercise', incrementCycle: false }]],
      ['exercise', [{ type: 'lawStudy', incrementCycle: true }]],
    ]);
  }

  if (doesNotIncludeLawStudyAndExercise) {
    return new Map([
      ['study', [{ type: 'review', incrementCycle: true }]],
      ['review', [{ type: 'review', incrementCycle: true }]],
    ]);
  }

  if (doesNotIncludeExerciseAndReview) {
    return new Map([
      ['study', [{ type: 'lawStudy', incrementCycle: true }]],
      ['lawStudy', [{ type: 'exercise', incrementCycle: true }]],
    ]);
  }

  if (doesNotIncludeLawStudyAndReview) {
    return new Map([
      ['study', [{ type: 'exercise', incrementCycle: true }]],
      ['exercise', [{ type: 'review', incrementCycle: true }]],
    ]);
  }

  return defaultTaskTypeSequence;
}

export class TaskCreationService {
  constructor(
    private readonly taskRepository: TaskRepository,
    private readonly userSubjectQuery: UserSubjectsStatusQuery,
  ) {}
  async execute(lastTask: Task): Promise<void> {
    if (lastTask.isExtra()) return;
    const topicPosition = await this.userSubjectQuery.topicPosition(
      lastTask.data.ownerId,
      lastTask.data.topicId,
    );

    const taskTypeSequenceforTopic = topicPosition
      ? getTaskCycleObjectByTaskConfig(topicPosition.taskType) as Map<TaskType, { type: TaskType; incrementCycle: boolean; }[]>
      : defaultTaskTypeSequence as Map<TaskType, { type: TaskType; incrementCycle: boolean; }[]>;

    const nextTasks =
      taskTypeSequenceforTopic.get(lastTask.data.type)?.map((t) => {
        const nextCycle = lastTask.data.cycle + (t.incrementCycle ? 1 : 0);
        return Task.create({
          ownerId: lastTask.data.ownerId,
          topicId: lastTask.data.topicId,
          type: t.type,
          cycle: nextCycle,
          plannedDate: lastTask.data.completedOn?.addDays(
            getNextCooldownByCycle(nextCycle)[t.type],
          ),
          finished: false,
          estimatedTimeToComplete: lastTask.data.estimatedTimeToComplete,
          courseId: lastTask.data.courseId
        }).value;
      }) ?? [];

    for (const nextTask of nextTasks) {
      await this.taskRepository.create(nextTask);
    }
    return;
  }
}
