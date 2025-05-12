import type { UUID } from 'crypto';
import { HelpContent } from '../../../domain/helpContent/HelpContent.js';
import type { HelpContentRepository } from '../../../domain/helpContent/HelpContentRepository.js';
import { ID } from '../../../domain/Id.js';
import { HelpContentModel } from './models/HelpContentModel.js';

export class MongooseHelpContentRepository implements HelpContentRepository {
  async create(helpContent: HelpContent): Promise<void> {
    await new HelpContentModel({
      _id: helpContent.data._id,
      title: helpContent.data.title,
      content: helpContent.data.content,
      videoUrl: helpContent.data.videoUrl,
      userId: helpContent.data.userId.value,
      iaAccess: helpContent.data.iaAccess,
      createdAt: new Date(),
    }).save();
  }
  async ofId(id: ID): Promise<HelpContent | null> {
    const helpContentData = await HelpContentModel.findOne({ _id: id })
      .lean()
      .exec();

    if (!helpContentData) {
      return null;
    }

    const helpContent = HelpContent.create({
      content: helpContentData.content,
      createdAt: helpContentData.createdAt,
      updatedAt: helpContentData.updatedAt,
      userId: ID.create(helpContentData.userId as UUID),
      videoUrl: helpContentData.videoUrl,
      title: helpContentData.title,
      id: ID.create(helpContentData._id),
      iaAccess: helpContentData.iaAccess,
    });

    if (helpContent.isLeft()) {
      return null;
    }

    return helpContent.value;
  }
  async save(helpContent: HelpContent): Promise<void> {
    await HelpContentModel.updateOne(
      { _id: helpContent.data._id },
      {
        content: helpContent.data.content,
        videoUrl: helpContent.data.videoUrl,
        updatedAt: helpContent.data.updatedAt,
        title: helpContent.data.title,
        userId: helpContent.data.userId.value,
        iaAccess: helpContent.data.iaAccess,
      },
    ).exec();
  }
  async delete(id: ID): Promise<void> {
    const result = await HelpContentModel.deleteOne().where({ _id: id }).exec();

    if (result.deletedCount === 0) {
      throw new Error('Help content not found');
    }
  }
  async fetchAll(): Promise<HelpContent[]> {
    const helpContents = await HelpContentModel.find().lean().exec();

    const helpContentsData = helpContents
      .map((helpContent) =>
        HelpContent.create({
          content: helpContent.content,
          userId: ID.create(helpContent.userId as UUID),
          videoUrl: helpContent.videoUrl,
          title: helpContent.title,
          createdAt: helpContent.createdAt,
          updatedAt: helpContent.updatedAt,
          iaAccess: helpContent.iaAccess,

          id: ID.create(helpContent._id),
        }),
      )
      .filter((helpContent) => helpContent.isRight())
      .map((either) => either.value);

    return helpContentsData;
  }
}
