import { ID } from '../../../domain/Id.js';
import { Subject } from '../../../domain/subject/Subject.js';
import { CourseDB } from './models/CourseModel.js';
// import { SubjectDB } from './models/SubjectModel.js';
// import {
//   UserCustomStudyDB,
//   UserCustomStudyModel,
// } from './models/UserSubjectStatusModal.js';

export class UserCustomStudyQuery {
  async subjects(courseId: ID, userId: ID) {
    // const courseData = (await UserCustomStudyModel.findOne({
    //   courseId: courseId.value,
    //   userId: userId.value,
    // })
    //   .populate('subjects.subjectId')
    //   .lean()
    //   .exec()) as unknown as Omit<UserCustomStudyDB, 'subjects'> & {
    //   subjects: (Omit<UserCustomStudyDB['subjects'][number], 'subjectId'> & {
    //     subjectId: SubjectDB;
    //   })[];
    // };
    // if (!courseData) {
    //   return null;
    // }
    // return courseData.subjects.map((v) => ({
    //   subject: Subject.create({
    //     id: ID.create(v.subjectId._id),
    //     description: v.subjectId.description,
    //     classification: v.subjectId.classification,
    //   }),
    //   relevance: v.customRelevance,
    //   expectedStudyTimeInMinutes: v.expectedStudyTimeInMinutes,
    // }));
  }
}
