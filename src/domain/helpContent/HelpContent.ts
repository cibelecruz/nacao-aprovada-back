import { right, type Either } from '../../shared/utils/Either.js';
import { ID } from '../Id.js';

type HelpContentProps = {
  _id: ID;
  title: string;
  content: string;
  iaAccess: boolean;
  videoUrl?: string;
  userId: ID;
  createdAt: Date;
  updatedAt: Date;
};

type HelpContentDataProps = {
  id?: ID;
  title: string;
  content: string;
  videoUrl?: string;
  iaAccess?: boolean;
  userId: ID;
  createdAt?: Date;
  updatedAt?: Date;
};

export class HelpContent {
  private constructor(private _data: HelpContentProps) {}

  updateContent(content: string): void {
    this._data.content = content;
  }

  updateTitle(title: string): void {
    this._data.title = title;
  }

  updateVideoUrl(videoUrl: string): void {
    this._data.videoUrl = videoUrl;
  }

  toggleAccess(value: boolean): void {
    this._data.iaAccess = value;
  }

  get data() {
    return this._data;
  }

  static create(data: HelpContentDataProps): Either<never, HelpContent> {
    return right(
      new HelpContent({
        _id: data.id ?? ID.create(),
        userId: data.userId,
        title: data.title,
        iaAccess: data.iaAccess ?? true,
        content: data.content,
        createdAt: data.createdAt ?? new Date(),
        updatedAt: data.updatedAt ?? new Date(),
        videoUrl: data.videoUrl ?? undefined,
      }),
    );
  }
}
