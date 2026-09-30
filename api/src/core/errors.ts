/**
 * Erros de domínio: os services lançam estes erros sem saber nada de HTTP;
 * o error handler da camada HTTP é o único lugar que os traduz em status.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  readonly statusCode = 400;
}

export class UnauthorizedError extends AppError {
  readonly statusCode = 401;
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403;
}

export class NotFoundError extends AppError {
  readonly statusCode = 404;
}

export class ConflictError extends AppError {
  readonly statusCode = 409;
}

export class ServiceUnavailableError extends AppError {
  readonly statusCode = 503;
}
