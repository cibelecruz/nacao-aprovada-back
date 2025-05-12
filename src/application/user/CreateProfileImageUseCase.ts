import { ID } from '../../domain/Id.js';
import { UserRepository } from '../../domain/user/UserRepository.js';
import { UserNotFoundError } from '../../errors/UserNotFoundError.js';
import { UseCase } from '../../shared/UseCase.js';
import { Either, left, right } from '../../shared/utils/Either.js';

type UploadImageProfileData = {
  userId: ID;
  imagePath: string;
  imageUrl: string;
};

export class UploadProfileImageUseCase implements UseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    imagePath,
    imageUrl,
    userId,
  }: UploadImageProfileData): Promise<Either<UserNotFoundError, undefined>> {
    const user = await this.userRepository.ofId(userId);

    if (!user) {
      return left(new UserNotFoundError());
    }

    if (typeof user.data.imagePath === 'string') {
      user.deleteImage();
    }

    user.uploadImage(imagePath, imageUrl);
    await this.userRepository.save(user);

    return right(undefined);
  }
}
