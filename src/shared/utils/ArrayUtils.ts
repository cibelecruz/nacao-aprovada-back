export function isTruthy<T>(v: T | undefined): v is T {
  return !!v;
}
