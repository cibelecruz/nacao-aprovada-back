import { Either, right } from '../../../shared/utils/Either.js';
import { CalendarDate } from '../../CalendarDate.js';
import { ID } from '../../Id.js';
import { TaskType } from '../../task/TaskType.js';

type UserSubjectsStatusProps = {
  _id: ID;
  userId: ID;
  courseId: ID;
  lastStudy?: CalendarDate;
  customizations: {
    subjectId: ID;
    active?: boolean;
    topicCustomizations?: {
      topicId: ID;
      active?: boolean;
      taskTypes?: string[];
    }[];
  }[];
  hitsAndMisses: {
    topicId: ID;
    hits?: number;
    misses?: number;
  }[];
};

export class UserSubjectsStatus {
  constructor(private readonly _data: UserSubjectsStatusProps) {}

  get data() {
    return this._data;
  }

  addActiveSubjectCustomization(subjecId: ID, active: boolean) {
    const customization = this._data.customizations.find(
      (c) => c.subjectId.value === subjecId.value,
    );

    if (customization) {
      customization.active = active;
    } else {
      this._data.customizations.push({
        subjectId: subjecId,
        active,
      });
    }
  }

  addTopicCustomization(
    subjecId: ID,
    topicId: ID,
    active?: boolean,
    taskTypes?: TaskType[],
  ) {
    const customization = this._data.customizations.find(
      (c) => c.subjectId.value === subjecId.value,
    );

    if (customization) {
      const topicCustomization = customization.topicCustomizations?.find(
        (tc) => tc.topicId.value === topicId.value,
      );

      if (topicCustomization) {
        if (active !== undefined) {
          topicCustomization.active = active;
        }
        if (taskTypes) {
          topicCustomization.taskTypes = taskTypes?.map((tt) => tt.value);
        }
      } else {
        if (customization.topicCustomizations !== undefined) {
          customization.topicCustomizations.push({
            topicId,
            active,
            taskTypes: taskTypes?.map((tt) => tt.value),
          });
        } else {
          customization.topicCustomizations = [
            {
              topicId,
              active,
              taskTypes: taskTypes?.map((tt) => tt.value),
            },
          ];
        }
      }
    } else {
      this._data.customizations.push({
        subjectId: subjecId,
        topicCustomizations: [
          {
            topicId,
            active,
            taskTypes: taskTypes?.map((tt) => tt.value),
          },
        ],
      });
    }
  }

  static create(
    data: Partial<UserSubjectsStatusProps> &
      Pick<UserSubjectsStatusProps, 'userId' | 'courseId'>,
  ): Either<never, UserSubjectsStatus> {
    const defaultData: UserSubjectsStatusProps = {
      userId: ID.create(data.userId.value),
      courseId: ID.create(data.courseId.value),
      _id: data._id ?? ID.create(),
      lastStudy: data.lastStudy,
      customizations: data.customizations ?? [],
      hitsAndMisses: data.hitsAndMisses ?? [],
    };
    return right(new UserSubjectsStatus(defaultData));
  }
}
