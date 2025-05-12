export interface HttpResponse<T = unknown> {
  statusCode: number;
  body: T;
}
export const OK = <T>(body: T): HttpResponse<T> => ({
  statusCode: 200,
  body,
});

export const Created = <T>(body: T): HttpResponse<T> => ({
  statusCode: 201,
  body,
});

export const Updated = <T>(body: T): HttpResponse<T> => ({
  statusCode: 204,
  body,
});

export const BadRequest = <T extends Error>(
  error: T,
): HttpResponse<string> => ({
  statusCode: 400,
  body: error.message,
});

export const Unauthorized = (): HttpResponse<string> => ({
  statusCode: 401,
  body: 'Unauthorized',
});

export const Forbidden = <T extends Error>(
  error?: T,
): HttpResponse<string> => ({
  statusCode: 403,
  body: error ? error.message : 'Forbidden',
});

export const NotFound = <T extends Error>(error?: T): HttpResponse<string> => ({
  statusCode: 404,
  body: error ? error.message : 'Not found.',
});

export const Conflict = <T extends Error>(error: T): HttpResponse<string> => ({
  statusCode: 409,
  body: error.message,
});

export const InternalServerError = <T extends Error>(
  error?: T,
): HttpResponse<string> => ({
  statusCode: 500,
  body: `Internal Server Error: ${error?.message}`,
});
