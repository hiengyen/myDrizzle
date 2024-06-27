import { ErrorRequestHandler, Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError } from '../errors/BadRequestError'
import { AuthenticationError } from '../errors/AuthenticationError'
import { NotFoundError } from '../errors/NotFoundError'
import { ConflictError } from '../errors/ConflictError'
import { ForbiddenError } from '../errors/ForbiddenError'
import { TokenExpiredError } from 'jsonwebtoken'

export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof TokenExpiredError) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: 'Token had been expired',
    })
  }

  if (error instanceof AuthenticationError) {
    return res.status(error.StatusCode).json(error.serialize())
  }

  if (error instanceof BadRequestError) {
    return res.status(error.StatusCode).json(error.serialize())
  }

  if (error instanceof ConflictError) {
    return res.status(error.StatusCode).json(error.serialize())
  }

  if (error instanceof ForbiddenError) {
    return res.status(error.StatusCode).json(error.serialize())
  }

  if (error instanceof NotFoundError) {
    return res.status(error.StatusCode).json(error.serialize())
  }

  //Debug error
  // logger.error(error.stack)

  const statusCode = StatusCodes.INTERNAL_SERVER_ERROR
  return res.status(statusCode).json({
    status: 'Error',
    code: statusCode,
    stack: error.stack, // display bug location
    message: 'Unexpected Error',
  })
}
