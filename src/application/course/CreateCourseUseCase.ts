import { Course } from '../../domain/course/Course.js';
import { CourseRepository } from '../../domain/course/CourseRepository.js';
import { ID } from '../../domain/Id.js';
import { Either, left, right } from '../../shared/utils/Either.js';

class CreateCourseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CreateCourseError';
  }
}

export class CreateCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(name: string, subjects: [] = []): Promise<Either<Error, ID>> {
    try {
      const id = ID.create();
      const course = Course.create({ _id: id, name, subjects });
      await this.courseRepository.create(course);
      return right(id);
    } catch (error) {
      return left(new CreateCourseError('Error creating course'));
    }
  }
}
