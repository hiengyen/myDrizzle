import { ErrorRequestHandler, Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import { BadRequestError } from '../errors/BadRequestError'
import { AuthenticationError } from '../errors/AuthenticationError'
import { NotFoundError } from '../errors/NotFoundError'

export const errorHandler: ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (error instanceof AuthenticationError) {
    return res.status(error.StatusCode).json(error.serialize())
  }

  if (error instanceof BadRequestError) {
    return res.status(error.StatusCode).json(error.serialize())
  }

  if (error instanceof NotFoundError) {
    return res.status(error.StatusCode).json(error.serialize())
  }

  //Debug error
  // logger.error(error.stack)

  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ message: 'Something bad happened, check code' })
}
