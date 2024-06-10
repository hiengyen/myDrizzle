import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'

interface CustomError extends Error {
  status?: number
}

const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const status = err.status || 500
  const message = err.message || 'Internal Server Error'
  const stack = err.stack
  res.status(status).json({
    status: status,
    message: message,
  })

  // Log the error to the cconsole (or to a logging service)
  logger.error(`${status} - ${message}`)
  logger.info(`${stack}`)
}

export default errorHandler
