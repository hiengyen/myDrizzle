interface ResponseMetadata {
  [key: string]: any
}

import { StatusCode, ReasonStatusCode } from './httpStatusCodes'

class SuccessResponse {
  message: string
  status: StatusCode
  metadata: ResponseMetadata

  constructor({
    message,
    statusCode = StatusCode.OK,
    reasonStatusCode = ReasonStatusCode.OK,
    metadata = {},
  }: {
    message: string
    statusCode?: StatusCode
    reasonStatusCode?: ReasonStatusCode
    metadata?: ResponseMetadata
  }) {
    this.message = !message ? reasonStatusCode : message
    this.status = statusCode
    this.metadata = metadata
  }

  send(res: any, headers: any = {}): any {
    return res.status(this.status).json(this)
  }
}

class OK extends SuccessResponse {
  constructor({
    message,
    metadata,
  }: {
    message: string
    metadata: ResponseMetadata
  }) {
    super({ message, metadata })
  }
}

class CREATED extends SuccessResponse {
  options: any

  constructor({
    options = {},
    message,
    statusCode = StatusCode.CREATED,
    reasonStatusCode = ReasonStatusCode.CREATED,
    metadata,
  }: {
    options?: any
    message: string
    statusCode?: StatusCode
    reasonStatusCode?: ReasonStatusCode
    metadata?: ResponseMetadata
  }) {
    super({
      message,
      statusCode,
      reasonStatusCode,
      metadata,
    })
    this.options = options
  }
}

export { OK, CREATED, SuccessResponse }
