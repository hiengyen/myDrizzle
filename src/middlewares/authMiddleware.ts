import { Request, Response, NextFunction } from 'express'
import logger from '../utils/logger'
import { JwtPayload } from 'jsonwebtoken'
import { AuthToken, UserRoles } from '../dto/enum'
import jwtService from '../services/jwtService'
import { BadRequestError } from '../errors/BadRequestError'
import { ForbiddenError } from '../errors/ForbiddenError'
import { UserInTokenPayloadDTO } from '../dto/userDTO'

//Get and authorized accessToken receive from FE
const isAuthorized = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const accessTokenFromCookie = req.cookies?.accessToken

  if (!accessTokenFromCookie) {
    logger.error('Validate access token failure: Missing token')
    throw new BadRequestError('Missing token')
  }

  await jwtService
    .verifyAuthToken(accessTokenFromCookie, AuthToken.AccessToken)
    .catch(() => {
      logger.error('Validate access token failure: Token invalid')
      throw new BadRequestError('Token invalid')
    })

  logger.info('Access token verification succeed')
  next()
}

const accessTokenFromExactUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const accessTokenFromCookie = await req.cookies?.accessToken
  const accessTokenDecoded: string | JwtPayload | null =
    await jwtService.decodeToken(accessTokenFromCookie)
  const userInToken: UserInTokenPayloadDTO =
    accessTokenDecoded as UserInTokenPayloadDTO
  logger.error(`Access token middleware failure: ${userInToken}`)
  const userIDInHeader: string | undefined = req.header('User-id')

  if (!accessTokenFromCookie) {
    logger.error(`Access token middleware failure: missing token`)
    throw new BadRequestError('Missing token')
  }
  if (!userIDInHeader) {
    logger.error(`Access token middleware failure: header missing User-id`)
    throw new BadRequestError('Request header missing User-id')
  }

  if (userInToken.id !== userIDInHeader) {
    logger.error(
      `Access token middleware failure: '${userIDInHeader}' differ from userID in token: '${userInToken.id}`,
    )
    throw new BadRequestError('Header User-id invalid!')
  }

  logger.info('Access token middleware secceed')
  next()
}

const refreshTokenFromExactUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const refreshTokenFromCookie = req.cookies?.refreshToken
  const refreshTokenDecoded: string | JwtPayload | null =
    await jwtService.decodeToken(refreshTokenFromCookie)

  const userInToken: UserInTokenPayloadDTO =
    refreshTokenDecoded as UserInTokenPayloadDTO
  const userIDInHeader: string | undefined = req.header('User-id')

  if (!refreshTokenFromCookie) {
    logger.error('Refresh token middleware failure: Missing token')
    throw new BadRequestError('Missing token')
  }
  if (!userIDInHeader) {
    logger.error('Refresh token middleware failure: header missing User-id')
    throw new BadRequestError('Request header missing User-id')
  }
  if (userInToken.id !== userIDInHeader) {
    logger.error(
      `Refresh token middleware failure: ${userIDInHeader} differ from userID in token: ${userInToken.id}`,
    )
    throw new BadRequestError('header User-id invalid!')
  }

  logger.info('Refresh token middleware secceed')
  next()
}

const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const refreshTokenFromCookie = req.cookies?.refreshToken

  if (!refreshTokenFromCookie) {
    logger.error('Admin middleware failure: Unauthorized request!')
    throw new BadRequestError('Unauthorized request!')
  }

  const refreshTokenDecoded: string | JwtPayload | null =
    await jwtService.decodeToken(refreshTokenFromCookie)
  const userInToken: UserInTokenPayloadDTO =
    refreshTokenDecoded as UserInTokenPayloadDTO

  if (userInToken.role !== UserRoles.Admin) {
    logger.error('Admin middleware failure: access denied')
    throw new ForbiddenError('Access denied')
  }

  logger.info('Refresh token middleware secceed')
  next()
}

export const authMiddleware = {
  isAuthorized,
  accessTokenFromExactUser,
  refreshTokenFromExactUser,
  isAdmin,
}
