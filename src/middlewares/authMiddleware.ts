import { Request, Response, NextFunction } from 'express'
import { JwtUtil } from '../utils/jwtUtil'
import { AT_KEY } from '../controllers/userController'
import logger from '../utils/logger'
import { StatusCodes } from 'http-status-codes'
import { sortedUniq } from 'lodash'
import { UserInPayLoad } from '../model/jwt'
import { JsonWebTokenError, JwtPayload } from 'jsonwebtoken'

//Get and authorized accessToken receive from FE
const isAuthorized = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //
  const accessTokenFromCookie = req.cookies?.accessToken
  console.log('accessTokenFromCookie: ', accessTokenFromCookie)
  console.log('---')
  if (!accessTokenFromCookie) {
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'Unauthorized! (Token not found)',
    })
  }

  try {
    const accessTokenDecoded = await JwtUtil.verifyToken(
      accessTokenFromCookie,
      AT_KEY
    )

    logger.info('User is authorized')
    next()
  } catch (error: any) {
    logger.error('authorize checking middleware: ' + error.message)
    if (error.message?.includes('jwt expired')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Unauthorized! (Token had been expired)',
      })
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Unhandle jwt error',
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
    logger.info(`access token: ${req.cookies.accessToken}`)
    const accessTokenDecoded: string | JwtPayload | null =
      await JwtUtil.verifyToken(accessTokenFromCookie, AT_KEY)
    const userIDInToken: UserInPayLoad = accessTokenDecoded as UserInPayLoad
    const userIDInHeader: string | undefined = req.header('user-id')

    if (!userIDInHeader) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Request header lack of user id!',
      })
    }
    if (userIDInToken.id !== userIDInHeader) {
      logger.error(
        `header userID: '${userIDInHeader}' differ from userID in token: '${userIDInToken.id}'`
      )
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Request from invalid id!',
      })
    }

    logger.info('Access token middleware success')
    next()
  } catch (error: any) {
    logger.error('Access token middleware: ' + error.message)
    if (error instanceof JsonWebTokenError) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Unauthorized! (Access token error...)',
      })
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Other error!',
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
      await JwtUtil.verifyToken(refreshTokenFromCookie, AT_KEY)

    const userIDInToken: UserInPayLoad = refreshTokenDecoded as UserInPayLoad
    const userIDInHeader: string | undefined = req.header('user-id')

    if (!userIDInHeader) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Request header lack of user id!',
      })
    }

    if (userIDInToken.id !== userIDInHeader) {
      logger.error(
        `header userID: '${userIDInHeader}' differ from userID in token: '${userIDInToken.id}'`
      )
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Request from invalid id!',
      })
    }

    logger.info('Refresh token middleware success')
    next()
  } catch (error: any) {
    logger.error('Refresh token middleware: ' + error.message)
    if (error instanceof JsonWebTokenError) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Unauthorized! (Refresh token error...)',
      })
    }

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Other error!',
    })
  }
}

export const authMiddleware = {
  isAuthorized,
  accessTokenFromExactUser,
  refreshTokenFromExactUser,
}
