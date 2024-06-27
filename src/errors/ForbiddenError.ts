import { StatusCodes } from 'http-status-codes'
import { CustomError } from '../utils/customError'

export class ForbiddenError extends CustomError {
  StatusCode: number = StatusCodes.UNAUTHORIZED
  constructor(public message: string) {
    super(message)
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
  serialize(): { message: string } {
    return { message: this.message }
  }
}
