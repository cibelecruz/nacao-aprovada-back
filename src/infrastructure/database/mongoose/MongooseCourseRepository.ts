import { Course } from '../../../domain/course/Course.js';
import { ID } from '../../../domain/Id.js';
import { CourseRepository } from '../../../domain/course/CourseRepository.js';
import { CourseDB, CourseModel } from './models/CourseModel.js';

export class MongooseCourseRepository implements CourseRepository {
  async ofIds(ids: ID[]): Promise<Course[]> {
    // Realiza a query no MongoDB
    const courses = await CourseModel.find({
      _id: { $in: ids.map((id) => id.value) }, // Mapeia os IDs para seus valores
    }).exec();

    // Retorna os documentos encontrados
    return courses.map((course) =>
      Course.create({
        _id: ID.create(course._id),
        name: course.name,
        subjects: course.subjects.map((subject) => ({
          id: ID.create(subject.id),
          relevance: subject.relevance,
          active: subject.active,
          topics: subject.topics.map((topic) => ({
            active: topic.active,
            id: ID.create(topic.id),
            relevance: topic.relevance,
          })),
        })),
      }),
    );
  }

  async create(course: Course): Promise<void> {
    await new CourseModel({
      _id: course.data._id.value,
      name: course.data.name,
      subjects: course.data.subjects.map((subject) => ({
        id: subject.id.value,
        active: subject.active,
        relevance: subject.relevance,
        topics: subject.topics.map((topic) => ({
          id: topic.id.value,
          active: topic.active,
          relevance: topic.relevance,
        })),
      })),
    }).save();
  }

  async ofId(id: ID): Promise<Course | null> {
    const courseData = await CourseModel.findOne({
      _id: id.value,
    })
      .lean()
      .exec();
    if (!courseData) {
      return null;
    }
    return Course.create({
      _id: ID.create(courseData._id),
      name: courseData.name,
      subjects: courseData.subjects.map((subject) => ({
        id: ID.create(subject.id),
        relevance: subject.relevance,
        active: subject.active,
        topics: subject.topics.map((topic) => ({
          active: topic.active,
          id: ID.create(topic.id),
          relevance: topic.relevance,
        })),
      })),
    });
  }

  async save(course: Course): Promise<void> {
    await CourseModel.updateOne(
      {
        _id: course.data._id.value,
      },
      {
        name: course.data.name,
        subjects: course.data.subjects.map((subject) => ({
          id: subject.id.value,
          relevance: subject.relevance,
          active: subject.active,
          topics: subject.topics.map((topic) => ({
            id: topic.id.value,
            active: topic.active,
            relevance: topic.relevance,
          })),
        })),
        deleted: course.data.deleted || false,
      },
    );
  }

  async getByTopicId(topicId: ID): Promise<CourseDB | null> {
    const courseData = await CourseModel.findOne({
      'subjects.topics._id': topicId.value,
    })
      .lean()
      .exec();
    if (!courseData) {
      return null;
    }
    return courseData;
  }
}
