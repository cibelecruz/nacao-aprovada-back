export interface UseCase<T = unknown> {
  execute(...args: unknown[]): Promise<T> | T;
}
