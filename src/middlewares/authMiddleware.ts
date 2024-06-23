import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'
import { StatusCodes } from 'http-status-codes'
import { JwtPayload, TokenExpiredError } from 'jsonwebtoken'
import { ErrorResponse } from '../utils/error.response'
import { UserInTokenPayloadDTO } from '../dto/userDTO'
import { AuthToken, UserRoles } from '../dto/enum'
import jwtService from '../services/jwtService'

//Get and authorized accessToken receive from FE
const isAuthorized = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessTokenFromCookie = req.cookies?.accessToken
  if (!accessTokenFromCookie) {
    throw new ErrorResponse(
      'Missing token',
      StatusCodes.BAD_REQUEST,
      'Missing token'
    )
  }

  try {
    await jwtService
      .verifyAuthToken(accessTokenFromCookie, AuthToken.AccessToken)
      .catch(() => {
        throw new ErrorResponse(
          'Token invalid',
          StatusCodes.BAD_REQUEST,
          'Token invalid'
        )
      })

    logger.info('Access token verification successed')
    next()
  } catch (error: any) {
    logger.error(
      'Validate access token failure: ' + error.loggerMs ?? error?.message
    )
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }
    if (error instanceof TokenExpiredError) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Token had been expired',
      })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Error occurred',
    })
  }
}

const accessTokenFromExactUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const accessTokenFromCookie = await req.cookies?.accessToken
    const accessTokenDecoded: string | JwtPayload | null =
      await jwtService.decodeToken(accessTokenFromCookie)
    const userInToken: UserInTokenPayloadDTO =
      accessTokenDecoded as UserInTokenPayloadDTO
    const userIDInHeader: string | undefined = req.header('user-id')

    if (!accessTokenFromCookie) {
      throw new ErrorResponse(
        'Missing token',
        StatusCodes.BAD_REQUEST,
        'Missing token'
      )
    }
    if (!userIDInHeader) {
      throw new ErrorResponse(
        'Request header missing user-id',
        StatusCodes.BAD_REQUEST,
        'Request header missing user-id!'
      )
    }
    if (userInToken.id !== userIDInHeader) {
      throw new ErrorResponse(
        'header user-id invalid!',
        StatusCodes.BAD_REQUEST,
        `header userID: '${userIDInHeader}' differ from userID in token: '${userInToken.id}'`
      )
    }

    logger.info('Access token middleware successed')
    next()
  } catch (error: any) {
    logger.error(
      'Access token middleware failure: ' + error.loggerMs ?? error?.message
    )
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Token error',
    })
  }
}

const refreshTokenFromExactUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const refreshTokenFromCookie = req.cookies?.refreshToken
    const refreshTokenDecoded: string | JwtPayload | null =
      await jwtService.decodeToken(refreshTokenFromCookie)
    const userInToken: UserInTokenPayloadDTO =
      refreshTokenDecoded as UserInTokenPayloadDTO
    const userIDInHeader: string | undefined = req.header('user-id')

    if (!refreshTokenFromCookie) {
      throw new ErrorResponse(
        'Missing token',
        StatusCodes.BAD_REQUEST,
        'Missing token'
      )
    }
    if (!userIDInHeader) {
      throw new ErrorResponse(
        'Request header missing user-id',
        StatusCodes.BAD_REQUEST,
        'Request header missing user-id!'
      )
    }
    if (userInToken.id !== userIDInHeader) {
      throw new ErrorResponse(
        'header user-id invalid!',
        StatusCodes.BAD_REQUEST,
        `header userID: '${userIDInHeader}' differ from userID in token: '${userInToken.id}'`
      )
    }

    logger.info('Refresh token middleware successed')
    next()
  } catch (error: any) {
    logger.error(
      'Refresh token middleware failure: ' + error.loggerMs ?? error?.message
    )
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Token error!',
    })
  }
}

const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshTokenFromCookie = req.cookies?.refreshToken

    if (!refreshTokenFromCookie) {
      throw new ErrorResponse(
        'Unauthorized request!',
        StatusCodes.UNAUTHORIZED,
        'Refresh token not found'
      )
    }

    const refreshTokenDecoded: string | JwtPayload | null =
      await jwtService.decodeToken(refreshTokenFromCookie)
    const userInToken: UserInTokenPayloadDTO =
      refreshTokenDecoded as UserInTokenPayloadDTO

    logger.info('Refresh token middleware successed')

    if (userInToken.role !== UserRoles.Admin) {
      throw new ErrorResponse(
        'Access denied',
        StatusCodes.FORBIDDEN,
        'Access denied'
      )
    }

    next()
  } catch (error: any) {
    if (error instanceof ErrorResponse) {
      logger.error('Refresh token middleware failure: ' + error.loggerMs)
      return res.status(error.status).json({
        message: error.message,
      })
    }

    logger.error('Cannot run cheking refresh token')
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Token error!',
    })
  }
}

export const authMiddleware = {
  isAuthorized,
  accessTokenFromExactUser,
  refreshTokenFromExactUser,
  isAdmin,
}
