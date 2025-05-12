import { Either, left, right } from '../../shared/utils/Either.js';

export class CourseName {
  private readonly name: string;

  private constructor(name: string) {
    this.name = name;
  }

  public static create(name: string): Either<Error, CourseName> {
    if (name.length > 200) {
      return left(
        new Error('O nome do curso deve ter no máximo 200 caracteres'),
      );
    }

    const regex = /^[a-zA-ZÀ-ÖØ-öø-ÿ0-9\s-]+$/;
    if (!regex.test(name)) {
      return left(
        new Error('O nome do curso deve conter apenas letras e números'),
      );
    }

    return right(new CourseName(name));
  }

  public get value(): string {
    return this.name;
  }
}
