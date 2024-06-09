import { StatusCode, ReasonStatusCode } from './httpStatusCodes'

class ErrorResponse extends Error {
  public status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

class ConflictRequestError extends ErrorResponse {
  constructor(
    message: string = ReasonStatusCode.CONFLICT,
    statusCode: number = StatusCode.FORBIDDEN,
  ) {
    super(message, statusCode)
  }
}

class BadRequestError extends ErrorResponse {
  constructor(
    message: string = ReasonStatusCode.CONFLICT,
    statusCode: number = StatusCode.FORBIDDEN,
  ) {
    super(message, statusCode)
  }
}

class AuthFailureError extends ErrorResponse {
  constructor(
    message: string = ReasonStatusCode.UNAUTHORIZED,
    statusCode: number = StatusCode.UNAUTHORIZED,
  ) {
    super(message, statusCode)
  }
}

class NotFoundError extends ErrorResponse {
  constructor(
    message: string = ReasonStatusCode.NOT_FOUND,
    statusCode: number = StatusCode.NOT_FOUND,
  ) {
    super(message, statusCode)
  }
}

class ForbiddenError extends ErrorResponse {
  constructor(
    message: string = ReasonStatusCode.FORBIDDEN,
    statusCode: number = StatusCode.FORBIDDEN,
  ) {
    super(message, statusCode)
  }
}

export {
  ConflictRequestError,
  BadRequestError,
  AuthFailureError,
  NotFoundError,
  ForbiddenError,
}
