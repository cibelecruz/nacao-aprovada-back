import { CalendarDate } from '../../../domain/CalendarDate.js';
import { ID } from '../../../domain/Id.js';
import { UserSubjectsStatus } from '../../../domain/user/userSubjectsStatus/UserSubjectsStatus.js';
import { UserSubjectsStatusRepository } from '../../../domain/user/userSubjectsStatus/UserSubjectsStatusRepository.js';
import { UserSubjectsStatusModel } from './models/UserSubjectsStatusModel.js';

export class MongooseUserSubjectsStatusRepository
  implements UserSubjectsStatusRepository
{
  async delete(userId: ID, courseId: ID): Promise<void> {
    await UserSubjectsStatusModel.deleteOne({
      userId: userId.value,
      courseId: courseId.value,
    }).exec();
  }
  async create(customStudy: UserSubjectsStatus): Promise<void> {
    await new UserSubjectsStatusModel({
      _id: customStudy.data._id.value,
      userId: customStudy.data.userId.value,
      courseId: customStudy.data.courseId.value,
      lastStudy: customStudy.data.lastStudy,
      customizations: customStudy.data.customizations.map((customization) => ({
        subjectId: customization.subjectId.value,
        active: customization.active,
        topicCustomizations: customization.topicCustomizations?.map(
          (topicCustomization) => ({
            topicId: topicCustomization.topicId.value,
            active: topicCustomization.active,
            taskTypes: topicCustomization.taskTypes,
          }),
        ),
      })),
      hitsAndMisses: customStudy.data.hitsAndMisses.map((hitAndMiss) => ({
        topicId: hitAndMiss.topicId.value,
        hits: hitAndMiss.hits,
        misses: hitAndMiss.misses,
      })),
    }).save();
  }

  async save(customStudy: UserSubjectsStatus): Promise<void> {
    await UserSubjectsStatusModel.updateOne(
      { _id: customStudy.data._id.value },
      {
        lastStudy: customStudy.data.lastStudy,
        customizations: customStudy.data.customizations.map(
          (customization) => ({
            subjectId: customization.subjectId.value,
            active: customization.active,
            topicCustomizations: customization.topicCustomizations?.map(
              (topicCustomization) => ({
                topicId: topicCustomization.topicId.value,
                active: topicCustomization.active,
                taskTypes: topicCustomization.taskTypes,
              }),
            ),
          }),
        ),
        hitsAndMisses: customStudy.data.hitsAndMisses.map((hitAndMiss) => ({
          topicId: hitAndMiss.topicId.value,
          hits: hitAndMiss.hits,
          misses: hitAndMiss.misses,
        })),
      },
    ).exec();
  }

  async ofId(userId: ID, courseId: ID): Promise<UserSubjectsStatus | null> {
    const result = await UserSubjectsStatusModel.findOne({
      userId: userId.value,
      courseId: courseId.value,
    })
      .lean()
      .exec();

    if (!result) {
      return null;
    }

    return UserSubjectsStatus.create({
      _id: ID.create(result._id),
      userId: ID.parse(result.userId).value as ID,
      courseId: ID.parse(result.courseId).value as ID,
      lastStudy: result.lastStudy
        ? (CalendarDate.fromString(result.lastStudy).value as CalendarDate)
        : undefined,
      customizations: result.customizations.map((customization) => ({
        subjectId: ID.parse(customization.subjectId).value as ID,
        active: customization.active,
        topicCustomizations: customization.topicCustomizations?.map(
          (topicCustomization) => ({
            topicId: ID.parse(topicCustomization.topicId).value as ID,
            active: topicCustomization.active,
            taskTypes: topicCustomization.taskTypes,
          }),
        ),
      })),
      hitsAndMisses: result.hitsAndMisses.map((hitAndMiss) => ({
        topicId: ID.parse(hitAndMiss.topicId).value as ID,
        hits: hitAndMiss.hits,
        misses: hitAndMiss.misses,
      })),
    }).value;
  }
}
