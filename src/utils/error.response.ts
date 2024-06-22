import { StatusCodes } from 'http-status-codes'

class ErrorResponse extends Error {
  loggerMs?: string
  status: StatusCodes

  constructor(message: string, status: StatusCodes, loggerMs?: string) {
    super(message)
    this.loggerMs = loggerMs
    this.status = status
  }
}

export { ErrorResponse }
