import { User } from '../../../domain/user/User.js';
import { ID } from '../../../domain/Id.js';
import { CalendarDate } from '../../../domain/CalendarDate.js';
import { Email } from '../../../domain/user/Email.js';
import { Name } from '../../../domain/user/Name.js';
import { UserStudyAvailability } from '../../../domain/user/UserStudyAvailability.js';
import { UserModel } from './models/UserModel.js';
import { TaskModel } from './models/TaskModel.js';

type ListUsersAggregateResult = {
  role: string;
  preferredStartDate: string;
  studyAvailability: Record<string, number>;
  onboardingComplete: boolean;
  phone?: string;
  cpf?: string;
  result: {
    _id: string;
    name: string;
  }[];
  _id: string;
  courses: {
    registrationDate: string;
    expirationDate: string;
    id: string;
  }[];
  email: string;
  name: string;
  deleted: boolean;
  jobPosition?: string;
};

type ListUserStudyTimesAggregateResult = {
  _id: string;
  studyTimeEntries: {
    date: string;
    amount: number;
  }[];
};

export class UserQuery {
  async userInfo({ id, email }: { id?: ID; email?: string }) {
    if (!id && !email) {
      return null;
    }
    const userData = await UserModel.findOne({
      ...(id ? { _id: id.value } : {}),
      ...(email ? { email: email } : {}),
    })
      .lean()
      .exec();

    if (!userData) {
      return null;
    }

    return User.create({
      id: ID.create(userData._id),
      preferedStartDate: userData.preferredStartDate
        ? CalendarDate.today()
        : undefined,
      studyAvailability: userData.studyAvailability
        ? UserStudyAvailability.default()
        : undefined,
      name: Name.create(userData.name).value as Name,
      courses: userData.courses.map((c) => ({
        id: ID.parse(c.id).value as ID,
        registrationDate: CalendarDate.fromString(c.registrationDate)
          .value as CalendarDate,
        expirationDate: CalendarDate.fromString(c.expirationDate)
          .value as CalendarDate,
      })),
      email: Email.create(userData.email).value as Email,
      onboardingComplete: userData.onboardingComplete,
      deleted: false,
      jobPosition: userData.jobPosition,
    }).value;
  }

  async listUsers() {
    const usersData = await UserModel.aggregate<ListUsersAggregateResult>()
      .lookup({
        from: 'courses',
        localField: 'courses.id',
        foreignField: '_id',
        pipeline: [
          {
            $project: {
              name: 1,
            },
          },
        ],
        as: 'result',
      })
      .exec();
    return usersData.map((userData) => {
      const courseNames = new Map(userData.result.map((c) => [c._id, c.name]));
      return {
        ...userData,
        courses: userData.courses.map((c) => ({
          id: c.id,
          registrationDate: c.registrationDate,
          expirationDate: c.expirationDate,
          name: courseNames.get(c.id) ?? 'Sem nome',
        })),
        deleted: userData.deleted ?? false,
      };
    });
  }

  async listStudyTimeEntries() {
    const result =
      await TaskModel.aggregate<ListUserStudyTimesAggregateResult>()
        .match({
          elapsedTimeInSeconds: { $exists: true },
          completedOn: {
            $gte: new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000),
          },
        })
        .group({
          _id: '$ownerId',
          studyTimeEntries: {
            $push: {
              date: '$completedOn',
              amount: '$elapsedTimeInSeconds',
            },
          },
        });

    return result;
  }
}
