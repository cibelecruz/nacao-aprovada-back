import { UserEvaluationModel } from './models/UserEvaluation.js';

export class UserEvaluationQuery {
  async UserEvaluation(email: string) {
    const userData = await UserEvaluationModel.find({ userEmail: email })
      .lean()
      .exec();

    if (!userData) {
      return null;
    }

    return userData;
  }
}
