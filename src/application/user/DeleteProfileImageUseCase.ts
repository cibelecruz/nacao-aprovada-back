import { ID } from '../../domain/Id.js';
import { UserRepository } from '../../domain/user/UserRepository.js';
import { FileNotFoundError } from '../../errors/FileNotFoundError.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type DeleteProfileImageData = {
  userId: ID;
};

export class DeleteProfileImageUseCase implements UseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    userId,
  }: DeleteProfileImageData): Promise<
    Either<UserNotFoundError | FileNotFoundError, string>
  > {
    const user = await this.userRepository.ofId(userId);

    if (!user) {
      return left(new UserNotFoundError());
    }

    const imagePath = user?.data.imagePath;

    if (!imagePath) {
      return left(new FileNotFoundError());
    }

    user.deleteImage();
    await this.userRepository.save(user);

    return right(imagePath);
  }
}
