// import { UserCustomStudy } from '../../../domain/user/userCustomStudy/UserSubjectsStatus.js';
// import { UserCustomStudyRepository } from '../../../domain/user/userCustomStudy/UserSubjectsStatusRepository.js';
// import { UserCustomStudyModel } from './models/UserSubjectStatusModal.js';

// export class MongooseCustomStudyRepository
//   implements UserCustomStudyRepository
// {
//   async create(customStudy: UserCustomStudy): Promise<void> {
//     await new UserCustomStudyModel({
//       _id: customStudy.data.id.value,
//       userId: customStudy.data.userId.value,
//       courseId: customStudy.data.courseId.value,
//       subjects: customStudy.data.subjects.map((subject) => ({
//         subjectId: subject.subjectId.value,
//         customRelevance: subject.customRelevance,
//       })),
//     }).save();
//   }

//   async save(customStudy: UserCustomStudy): Promise<void> {
//     await UserCustomStudyModel.updateOne(
//       { _id: customStudy.data.id.value },
//       {
//         subjects: customStudy.data.subjects.map((subject) => ({
//           subjectId: subject.subjectId.value,
//           customRelevance: subject.customRelevance,
//         })),
//       },
//     ).exec();
//   }
// }
