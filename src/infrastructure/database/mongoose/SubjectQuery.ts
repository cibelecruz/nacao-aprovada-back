import { ID } from '../../../domain/Id.js';
import { SubjectModel } from '../mongoose/models/SubjectModel.js';

export class SubjectQuery {
  async list() {
    return await SubjectModel.find({
      deleted: {
        $ne: true,
      },
    })
      .lean()
      .exec();
  }

  async find(id: ID) {
    return await SubjectModel.findById(id).lean().exec();
  }
}
