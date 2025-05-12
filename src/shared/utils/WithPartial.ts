export type WithPartial<T, P extends keyof T> = Omit<T, P> & {
  [K in P]?: T[K];
};
