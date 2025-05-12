import { getStorage } from 'firebase-admin/storage';
import { Either, left, right } from '../../../shared/utils/Either.js';
import { FailedToSaveFileError } from '../../../errors/FailedToSaveFileError.js';
import { FileNotFoundError } from '../../../errors/FileNotFoundError.js';

export class FirebaseStorageService {
  async uploadFile(
    filePath: string,
    data: Buffer,
  ): Promise<Either<FailedToSaveFileError, { filePath: string; url: string }>> {
    const storage = getStorage();
    const bucket = storage.bucket();
    const file = bucket.file(`user-images/${filePath}`);
    try {
      await file.save(data);
      const url = file.publicUrl();
      const pathInStorage = file.name;
      return right({ filePath: pathInStorage, url });
    } catch {
      return left(new FailedToSaveFileError());
    }
  }

  async getFile(filePath: string): Promise<Either<FileNotFoundError, Buffer>> {
    const storage = getStorage();
    const bucket = storage.bucket();

    const file = bucket.file(filePath);
    try {
      const [exists] = await file.exists();
      if (!exists) {
        return left(new FileNotFoundError());
      }
      const [content] = await file.download();
      return right(content);
    } catch {
      return left(new FileNotFoundError());
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    const storage = getStorage();
    const bucket = storage.bucket();

    const file = bucket.file(filePath);
    await file.delete();
  }
}
