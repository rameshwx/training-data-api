export class AppError extends Error {
  constructor(statusCode, code, message, details = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function databaseError(error) {
  if (error instanceof AppError) return error;
  if (error?.code === '23505') {
    return new AppError(409, 'CONFLICT', 'The requested record already exists.');
  }
  if (error?.code === '22P02') {
    return new AppError(400, 'INVALID_INPUT', 'One or more input values are invalid.');
  }
  return error;
}
