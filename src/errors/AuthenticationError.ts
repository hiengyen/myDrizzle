import { StatusCodes } from 'http-status-codes'
import { CustomError } from '../utils/customError'

export class AuthenticationError extends CustomError {
  StatusCode: number = StatusCodes.UNAUTHORIZED
  constructor(public message: string) {
    super(message)
    Object.setPrototypeOf(this, AuthenticationError.prototype)
  }
  serialize(): { message: string } {
    return { message: this.message }
  }
}
