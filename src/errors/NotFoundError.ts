import { StatusCodes } from 'http-status-codes'
import { CustomError } from '../utils/customError'

export class NotFoundError extends CustomError {
  StatusCode: number = StatusCodes.NOT_FOUND
  constructor(public message: string) {
    super(message)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
  serialize(): { message: string } {
    return { message: this.message }
  }
}
