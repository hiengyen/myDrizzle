import { Request, Response, NextFunction } from 'express'
import { JwtUtil } from '../utils/jwtUtil'
import { AT_KEY } from '../controllers/userController'
import logger from '../utils/logger'
import { StatusCodes } from 'http-status-codes'
import { UserInPayLoad } from '../model/jwt'
import { JsonWebTokenError, JwtPayload } from 'jsonwebtoken'
import { ErrorResponse } from '../utils/error.response'

//Get and authorized accessToken receive from FE
const isAuthorized = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const accessTokenFromCookie = req.cookies?.accessToken
  if (!accessTokenFromCookie) {
    throw new ErrorResponse(
      'Unauthorized! (Token not found)',
      StatusCodes.UNAUTHORIZED,
      'Unauthorized! (Token not found)'
    )

  }

  try {
    const accessTokenDecoded = await JwtUtil.verifyToken(
      accessTokenFromCookie,
      AT_KEY
    )

    logger.info('Access token verification successed')
    next()
  } catch (error: any) {
    if (error instanceof ErrorResponse) {
      logger.error('Validate acceess token failure: ' + error.loggerMs)
      return res.status(error.status).json({
        message: error.message,
      })
    }

    logger.error('Validate access token failure: ' + error?.message)
    if (error.message?.includes('jwt expired')) {
      return res.status(StatusCodes.FORBIDDEN).json({

        message: 'Unauthorized! (Token had been expired)',
      })
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Token validation error',
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
      await JwtUtil.decodeToken(accessTokenFromCookie)
    const userInToken: UserInPayLoad = accessTokenDecoded as UserInPayLoad
    const userIDInHeader: string | undefined = req.header('user-id')

    if (!accessTokenFromCookie) {
      throw new ErrorResponse(
        'Unauthorized request!',
        StatusCodes.UNAUTHORIZED,
        'Access token not found'
      )
    }
    if (!userIDInHeader) {
      throw new ErrorResponse(
        'Request header missing user id',
        StatusCodes.BAD_REQUEST,
        'Request header missing user id!'
      )
    }
    if (userInToken.id !== userIDInHeader) {
      throw new ErrorResponse(
        `header userID: '${userIDInHeader}' differ from userID in token: '${userInToken.id}'`,
        StatusCodes.BAD_REQUEST,
        'Request header missing user id!'
      )
    }

    logger.info('Access token middleware successed')
    next()
  } catch (error: any) {
    if (error instanceof ErrorResponse) {
      logger.error('Access token middleware failure: ' + error.loggerMs)
      return res.status(error.status).json({
        message: error.message,
      })
    }

    logger.error('Cannot run cheking access token')
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
      await JwtUtil.decodeToken(refreshTokenFromCookie)

    const userInToken: UserInPayLoad = refreshTokenDecoded as UserInPayLoad
    const userIDInHeader: string | undefined = req.header('user-id')

    if (!refreshTokenFromCookie) {
      throw new ErrorResponse(
        'Unauthorized request!',
        StatusCodes.UNAUTHORIZED,
        'Refresh token not found'
      )
    }
    if (!userIDInHeader) {
      throw new ErrorResponse(
        'Request header missing user id',
        StatusCodes.BAD_REQUEST,
        'Request header missing user id!'
      )
    }
    if (userInToken.id !== userIDInHeader) {
      throw new ErrorResponse(
        `header userID: '${userIDInHeader}' differ from userID in token: '${userInToken.id}'`,
        StatusCodes.BAD_REQUEST,
        'Request header missing user id!'
      )
    }

    logger.info('Refresh token middleware successed')
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
}
