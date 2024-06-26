import { StatusCodes } from 'http-status-codes'
import { CustomError } from '../utils/customError'

export class BadRequestError extends CustomError {
  StatusCode: number = StatusCodes.BAD_REQUEST
  constructor(public message: string) {
    super(message)
    Object.setPrototypeOf(this, BadRequestError.prototype)
  }

  serialize(): { message: string } {
    return { message: this.message }
  }
}
