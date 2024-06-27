import { StatusCodes } from 'http-status-codes'
import { CustomError } from '../utils/customError'

export class ConflictError extends CustomError {
  StatusCode: number = StatusCodes.CONFLICT
  constructor(public message: string) {
    super(message)
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
  serialize(): { message: string } {
    return { message: this.message }
  }
}
