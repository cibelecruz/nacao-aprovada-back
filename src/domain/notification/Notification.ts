import { right, type Either } from '../../shared/utils/Either.js';
import { ID } from '../Id.js';

type NotificationProps = {
  _id: ID;
  title: string;
  description: string;
  courseId?: ID;
  target: 'all' | 'one';
  startDate: string;
  endDate: string;
  userId: ID;
  active?: boolean;
};

type CreateNotificationDataProps = {
  id?: ID;
  title: string;
  description: string;
  courseId?: ID;
  target: 'all' | 'one';
  startDate: string;
  endDate: string;
  userId: ID;
  active?: boolean;
};

export class Notification {
  private constructor(private _data: NotificationProps) {}

  updateTitle(title: string): void {
    this._data.title = title;
  }

  updateDescription(description: string): void {
    this._data.description = description;
  }

  updateTarget(target: 'all' | 'one'): void {
    this._data.target = target;
  }

  updateStartDate(startDate: string): void {
    this.data.startDate = startDate;
  }
  updateEndDate(endDate: string): void {
    this.data.endDate = endDate;
  }

  updateActive(active: boolean): void {
    this.data.active = active;
  }

  updateCourse(courseId: ID | undefined): void {
    this._data.courseId = courseId;
  }

  get data() {
    return this._data;
  }

  static create(
    data: CreateNotificationDataProps,
  ): Either<never, Notification> {
    return right(
      new Notification({
        _id: data.id ?? ID.create(),
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
        title: data.title,
        target: data.target,
        userId: data.userId,
        active: data.active,
        courseId: data.courseId ?? undefined,
      }),
    );
  }
}
