import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import ms from 'ms'
import logger from '../utils/logger'
import {
  UserInTokenPayloadDTO,
  RefreshTokenUseds,
  UserResponseDTO,
  UserUpdateDTO,
  UserInsertDTO,
  UserResponseSummaryDTO,
} from '../dto/userDTO'
import jwtService from '../services/jwtService'

import userService from '../services/userService'
import { AuthToken } from '../dto/enum'
import { JwtPayload, TokenExpiredError } from 'jsonwebtoken'

import { BadRequestError } from '../errors/BadRequestError'
import { ConflictError } from '../errors/ConflictError'
import { ForbiddenError } from '../errors/ForbiddenError'

export const AT_KEY = process.env.AT_SECRET_KEY
export const RT_KEY = process.env.RT_SECRET_KEY
const ACCESS_TOKEN_LIFE_SPAN = '1 days'
const REFRESH_TOKEN_LIFE_SPAN = '7 days'

/**
 * Make user registration
 * If input email had been registed by other user, then response 'user already exist'
 * If not, add user info to the DB with no provided token yet
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const signup = async (req: Request, res: Response, next: NextFunction) => {
  const user: UserInsertDTO = {
    userName: req.body.name,
    ...req.body,
  }

  const holderUser: UserResponseDTO | undefined =
    await userService.getUserResponseByEmail(user.email)

  if (holderUser) throw new BadRequestError('User already exists')

  await userService.insertNewUser(user)
  logger.info(`User with email ${user.email} signed up successfull`)
  res.status(StatusCodes.CREATED).json({
    message: 'Sign-up success',
  })
}

/**
 * Log user in the user
 * If the current tokens are still valid, then return `Already login`
 * If not, create tokens and send back in header; body'response will go with the user'information
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const login = async (req: Request, res: Response, next: NextFunction) => {
  const accessTokenFromCookie = req.cookies?.accessToken
  const refreshTokenFromCookie = req.cookies?.refreshToken

  //If both token are verified and refresh token is stored in DB, then will not create new token
  try {
    // Get userID from accesstoken payload
    const accessTokenDecoded = await jwtService.verifyAuthToken(
      accessTokenFromCookie,
      AuthToken.AccessToken
    )
    const userInToken: UserInTokenPayloadDTO =
      accessTokenDecoded as UserInTokenPayloadDTO

    //Query all refresh tokens
    const refreshTokenBucket: RefreshTokenUseds | undefined =
      await userService.getUserRefreshTokenUsed(userInToken.id)

    logger.error('Pass')
    if (!refreshTokenBucket) throw new BadRequestError('User none exists!')

    if (refreshTokenBucket.refreshTokenUsed) {
      const indifferentTokenBucket: string[] =
        refreshTokenBucket.refreshTokenUsed.filter(
          token => token === refreshTokenFromCookie
        )

      // If refresh token already existed in DB
      if (indifferentTokenBucket.length !== 0) {
        try {
          await jwtService.verifyAuthToken(
            refreshTokenFromCookie,
            AuthToken.RefreshToken
          )
        } catch (error: any) {
          // If DB had that refreshToken which has been expired already so must delete that
          if (error instanceof TokenExpiredError) {
            logger.error('Token validate: generating denied')
            await userService.deleteRefreshToken(
              refreshTokenFromCookie,
              userInToken.id
            )

            // and keep processing the login
            throw {}
          }
        }
        // User already been login
        throw new ConflictError('')
      }
    }
  } catch (error: any) {
    if (error instanceof ConflictError) {
      // Go in here if user already been login
      throw new ConflictError(`User already been login`)
    }
  }

  // Main logic of login
  logger.info(`logging in...`)
  const validUser: UserResponseSummaryDTO =
    await userService.getValidUserResponseSummary(
      req.body.email,
      req.body.password
    )

  const userInPayLoad: { id: string; role: string } = {
    id: validUser.userID,
    role: validUser.role,
  }

  //create AT, RT
  const accessToken: string | undefined = await jwtService.generateAuthToken(
    userInPayLoad,
    AuthToken.AccessToken,
    ACCESS_TOKEN_LIFE_SPAN
  )

  const refreshToken: string | undefined = await jwtService.generateAuthToken(
    userInPayLoad,
    AuthToken.RefreshToken,
    REFRESH_TOKEN_LIFE_SPAN
  )

  if (!accessToken || !refreshToken) throw new Error('Token error')

  //set two token to cookie
  res.cookie(AuthToken.AccessToken, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('14 days'),
  })

  res.cookie(AuthToken.RefreshToken, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('14 days'),
  })

  //Push refresh token to DB
  await userService.pushRefreshToken(refreshToken, validUser.userID)

  //Return user info in DB
  res.status(StatusCodes.OK).json({
    message: 'Login API succeed',
    info: {
      ...validUser,
    },
  })
}

/**
 * Log user out, clear user's token
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const logout = async (req: Request, res: Response) => {
  //Get UserID in token
  const refreshTokenFromCookie: string = req.cookies?.refreshToken
  const refreshTokenDecoded: string | JwtPayload | null =
    await jwtService.decodeToken(refreshTokenFromCookie)

  if (!refreshTokenDecoded) throw new BadRequestError('Missing token')

  const userInToken: UserInTokenPayloadDTO =
    refreshTokenDecoded as UserInTokenPayloadDTO

  //Query all refresh tokens and delete current user's token
  userService.deleteRefreshToken(refreshTokenFromCookie, userInToken.id)

  logger.info('Logout success')
  res.clearCookie(AuthToken.AccessToken)
  res.clearCookie(AuthToken.RefreshToken)
  res.status(StatusCodes.OK).json({ message: 'Logout API success!' })
}

/**
 * Make new access token. Also checking if DB is containing this refresh token or not
 * If not, then clear all the refresh token in the DB and user must login again for new valid refresh token
 *
 * @param {Request} req
 * @param {Response} res
 */
const refreshToken = async (req: Request, res: Response) => {
  const refreshTokenFromCookie: string = req.cookies?.refreshToken
  const userIDInHeader: string | undefined = req.header('User-id')

  if (!userIDInHeader) {
    logger.error('RefreshToken api failure: header missing User-id')
    throw new BadRequestError('Request header missing User-id')
  }
  const userRefreshTokenList: RefreshTokenUseds | undefined =
    await userService.getUserRefreshTokenUsed(userIDInHeader)

  if (!userRefreshTokenList) throw new BadRequestError(`User none exist`)

  //Hacker's request: must clear all refresh token to login again
  if (
    !userRefreshTokenList.refreshTokenUsed ||
    !userRefreshTokenList.refreshTokenUsed.find(
      token => token === refreshTokenFromCookie
    )
  ) {
    logger.error(
      'Unknown refresh token: auto clear all refresh token in database'
    )
    await userService.clearUserRefreshTokenUsed(userIDInHeader)
    throw new ForbiddenError('Invalid token!')
  }

  //Down here token must be valid
  //Get user information from db
  const userData: UserResponseDTO | undefined =
    await userService.getUserResponseByID(userIDInHeader)

  if (!userData) throw new BadRequestError(`User none exist`)

  //Create new AT
  const accessToken: any = await jwtService.generateAuthToken(
    {
      id: userData.userID,
      role: userData.role,
    },
    AuthToken.AccessToken,
    ACCESS_TOKEN_LIFE_SPAN
  )
  res.cookie(AuthToken.AccessToken, accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('14 days'),
  })

  logger.info('New accessToken: ' + accessToken)
  res.status(StatusCodes.OK).json({
    message: 'Refresh token succeed',
  })
}

/**
 * Update user information(not include password)
 * If updated email had already been existed in DB, return
 *
 * @param {Request} req
 * @param {Response} res
 */
const updateInfo = async (req: Request, res: Response) => {
  const userIDInHeader: string | undefined = req.header('User-id')

  if (!userIDInHeader) {
    logger.error('Update user info api failure: header missing User-id')
    throw new BadRequestError('Request header missing User-id')
  }
  const userData: UserUpdateDTO = { userIDInHeader, ...req.body }

  // Check if email had been used for other user
  const checkEmailInUsed = await userService.checkEmailInUsed(
    userData.email,
    userIDInHeader
  )
  if (checkEmailInUsed)
    throw new ConflictError('This email has already been registered')

  const updatedUser: UserResponseSummaryDTO[] =
    await userService.updateUserInfo(userData)

  logger.info(`Update user information succeed`)
  res.status(StatusCodes.OK).json({
    message: 'Update succeed',
    infor: updatedUser,
  })
}

/**
 * Update user information(not include password)
 * If updated email had already been existed in DB, return
 *
 * @param {Request} req
 * @param {Response} res
 */
const getUserWithJWT = async (req: Request, res: Response) => {
  const accessTokenFromCookie = req.cookies?.accessToken
  const accessTokenDecoded: string | JwtPayload | null =
    await jwtService.decodeToken(accessTokenFromCookie)
  const accessTokenPayload: UserInTokenPayloadDTO =
    accessTokenDecoded as UserInTokenPayloadDTO

  logger.info(accessTokenPayload.id)
  const userInfo: UserResponseSummaryDTO | undefined =
    await userService.getUserResponseSummaryByID(accessTokenPayload.id)

  if (!userInfo) throw new BadRequestError('User none exists')

  logger.info(`Get user information succeed`)
  res.status(StatusCodes.OK).json({
    message: 'Update succeed',
    infor: userInfo,
  })
}

export default {
  signup,
  login,
  logout,
  refreshToken,
  updateInfo,
  getUserWithJWT,
}
