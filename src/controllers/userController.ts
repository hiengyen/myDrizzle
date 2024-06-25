import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import ms from 'ms'
import logger from '../utils/logger'
import { ErrorResponse } from '../utils/error.response'
import {
  UserInTokenPayloadDTO,
  RefreshTokenUseds,
  UserResponseDTO,
  UserUpdateDTO,
  User,
  UserInsertDTO,
  UserResponseSummaryDTO,
} from '../dto/userDTO'
import jwtService from '../services/jwtService'

import userService from '../services/userService'
import { AuthToken } from '../dto/enum'
import { JwtPayload, TokenExpiredError } from 'jsonwebtoken'

/**
 * Make user registration
 * If input email had been registed by other account, then response 'user already exist'
 * If not, add user info to the DB with no provided token yet
 *
 * @param {Request} req
 * @param {Response} res
 * @param {NextFunction} next
 */
const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user: UserInsertDTO = req.body

    const holderUser: UserResponseDTO | undefined =
      await userService.getUserResponseByEmail(user.email)

    if (holderUser) {
      throw new ErrorResponse(
        'User already exist',
        StatusCodes.CONFLICT,
        'User already exist'
      )
    }

    await userService.insertNewUser(user)
    logger.info(`User with email ${user.email} signed up successfull`)
    return res.status(StatusCodes.CREATED).json({
      message: 'Sign-up success',
    })
  } catch (error: any) {
    logger.error('Sign up failure: ' + error.loggerMs && error?.message)
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Cannot signup',
    })
  }
}

/**
 * Log user in the account
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

  try {
    //If both token are verified and refresh token is stored in DB, then will not create new token
    const accessTokenDecoded = await jwtService.verifyAuthToken(
      accessTokenFromCookie,
      AuthToken.AccessToken
    )
    const userInToken: UserInTokenPayloadDTO =
      accessTokenDecoded as UserInTokenPayloadDTO

    //Query all refresh tokens
    const refreshTokenBucket: RefreshTokenUseds | undefined =
      await userService.getUserRefreshTokenUsed(userInToken.id)

    if (!refreshTokenBucket) {
      logger.error('User none exists!')
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'User none exists!',
      })
    }

    // Check if refresh token already existed in DB
    if (refreshTokenBucket.refreshTokenUsed) {
      const newRefreshTokenBucket: string[] =
        refreshTokenBucket.refreshTokenUsed.filter(
          token => token === refreshTokenFromCookie
        )

      if (newRefreshTokenBucket.length !== 0) {
        try {
          await jwtService.verifyAuthToken(
            refreshTokenFromCookie,
            AuthToken.RefreshToken
          )
        } catch (error: any) {
          // If DB had that refreshToken which has been expired already so must delete that
          if (error instanceof TokenExpiredError) {
            await userService.deleteRefreshToken(
              refreshTokenFromCookie,
              userInToken.id
            )

            // and keep processing the login
            throw {}
          }
        }

        throw new ErrorResponse(
          `User already been login`,
          StatusCodes.CONFLICT,
          'User already been login !'
        )
      }
    }
  } catch (error: any) {
    if (error instanceof ErrorResponse) {
      // Go in here if user already been login
      logger.error(error.loggerMs)
      return res.status(error.status).json({
        message: error.message,
      })
    }
  }

  // Main logic of login
  try {
    logger.info(`loging in...`)
    const validUser: UserResponseSummaryDTO =
      await userService.getValidUserResponseSummary(
        req.body.email,
        req.body.password
      )

    const userInPayLoad: { id: string; role: string } = {
      id: validUser.id,
      role: validUser.role,
    }

    //create AT, RT
    const accessToken: string | undefined = await jwtService.generateAuthToken(
      userInPayLoad,
      AuthToken.AccessToken,
      '1 days'
    )

    const refreshToken: string | undefined = await jwtService.generateAuthToken(
      userInPayLoad,
      AuthToken.RefreshToken,
      '7 days'
    )

    if (!accessToken || !refreshToken) {
      throw new ErrorResponse(
        'Token error',
        StatusCodes.INTERNAL_SERVER_ERROR,
        `Cannot create token`
      )
    }

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
    await userService.pushRefreshToken(refreshToken, validUser.id)

    //Return account info in DB
    return res.status(StatusCodes.OK).json({
      message: 'Login API successed',
      info: {
        ...validUser,
      },
    })
  } catch (error: any) {
    logger.error('Login failure: ' + error.loggerMs && error?.message)
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Cannot login',
    })
  }
}

/**
 * Log user out, clear user's token
 * @param {Request} req
 * @param {Response} res
 * @returns
 */
const logout = async (req: Request, res: Response) => {
  try {
    //Get UserID in token
    const refreshTokenFromCookie: string = req.cookies?.refreshToken
    const refreshTokenDecoded: string | JwtPayload | null =
      await jwtService.decodeToken(refreshTokenFromCookie)
    if (!refreshTokenDecoded) {
      throw new ErrorResponse(
        'Missing token',
        StatusCodes.BAD_REQUEST,
        'Missing refresh token'
      )
    }
    const userInToken: UserInTokenPayloadDTO =
      refreshTokenDecoded as UserInTokenPayloadDTO

    //Query all refresh tokens and delete current user's token
    userService.deleteRefreshToken(refreshTokenFromCookie, userInToken.id)

    logger.info('Logout success')
    res.clearCookie(AuthToken.AccessToken)
    res.clearCookie(AuthToken.RefreshToken)
    return res.status(StatusCodes.OK).json({ message: 'Logout API success!' })
  } catch (error: any) {
    logger.error('Logout failure: ' + error.loggerMs && error?.message)
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Cannot logout',
    })
  }
}

/**
 * Make new access token. Also checking if DB is containing this refresh token or not
 * If not, then clear all the refresh token in the DB and user must login again for new valid refresh token
 *
 * @param {Request} req
 * @param {Response} res
 */
const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshTokenFromCookie: string = req.cookies?.refreshToken
    const userIDInHeader: string = String(req.header('user_id'))

    const userRefreshTokenList: RefreshTokenUseds | undefined =
      await userService.getUserRefreshTokenUsed(userIDInHeader)

    if (!userRefreshTokenList) {
      throw new ErrorResponse(
        `User none exist`,
        StatusCodes.BAD_REQUEST,
        `User none exist`
      )
    }
    //Hacker's request: must clear all refresh token to login again
    if (
      !userRefreshTokenList.refreshTokenUsed ||
      !userRefreshTokenList.refreshTokenUsed.find(
        token => token === refreshTokenFromCookie
      )
    ) {
      logger.error(
        'Unknown refresh token: auto clear all refresh token in database.'
      )
      await userService.clearUserRefreshTokenUsed(userIDInHeader)
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Invalid token!',
      })
    }

    //Down here token must be valid
    //Get user information from db
    const userData: UserResponseDTO | undefined =
      await userService.getUserResponseByID(userIDInHeader)

    if (!userData) {
      throw new ErrorResponse(
        `User none exist`,
        StatusCodes.BAD_REQUEST,
        `User none exist`
      )
    }

    //Create new AT
    const accessToken: any = await jwtService.generateAuthToken(
      {
        id: userData.id,
        role: userData.role,
      },
      AuthToken.AccessToken,
      '5 minutes'
    )
    res.cookie(AuthToken.AccessToken, accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days'),
    })

    logger.info('New accessToken: ' + accessToken)
    return res.status(StatusCodes.OK).json({
      message: 'Refresh access token',
    })
  } catch (error: any) {
    logger.error('Refresh token failure: ' + error.loggerMs && error?.message)
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Cannot refresh token',
    })
  }
}

/**
 * Update user information(not include password)
 * If updated email had already been existed in DB, return
 *
 * @param {Request} req
 * @param {Response} res
 */
const updateInfo = async (req: Request, res: Response) => {
  try {
    const userID: string = String(req.header('user_id'))
    const userData: UserUpdateDTO = req.body

    // Check if email had been used for other account
    const checkEmailInUsed = await userService.checkEmailInUsed(
      userData.email,
      userID
    )
    if (checkEmailInUsed) {
      throw new ErrorResponse(
        'This email is being used by another account',
        StatusCodes.CONFLICT,
        'This email has already been registeree'
      )
    }

    const updatedUser: UserResponseDTO[] = await userService.updateUserInfo(
      userData,
      userID
    )

    logger.info(`Update user information successed`)
    return res.status(StatusCodes.OK).json({
      message: 'Update successed',
      infor: updatedUser,
    })
  } catch (error: any) {
    logger.error('Update user failure: ' + error.loggerMs && error?.message)
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json('Cannot update infor')
  }
}

/**
 * Update user information(not include password)
 * If updated email had already been existed in DB, return
 *
 * @param {Request} req
 * @param {Response} res
 */
const getUserWithJWT = async (req: Request, res: Response) => {
  try {
    const accessTokenFromCookie = req.cookies?.accessToken
    const accessTokenDecoded: string | JwtPayload | null =
      await jwtService.decodeToken(accessTokenFromCookie)
    const accessTokenPayload: UserInTokenPayloadDTO =
      accessTokenDecoded as UserInTokenPayloadDTO

    logger.info(accessTokenPayload.id)
    const userInfo: UserResponseSummaryDTO | undefined =
      await userService.getUserResponseSummaryByID(accessTokenPayload.id)

    if (!userInfo) {
      throw new ErrorResponse(
        'User none exists',
        StatusCodes.BAD_REQUEST,
        'User none exists!'
      )
    }

    logger.info(`Get user information successed`)
    return res.status(StatusCodes.OK).json({
      message: 'Update successed',
      infor: userInfo,
    })
  } catch (error: any) {
    logger.error(
      'Get account info failure: ' + error.loggerMs && error?.message
    )
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json('Cannot get account infor')
  }
}

export const userController = {
  signup,
  login,
  logout,
  refreshToken,
  updateInfo,
  getUserWithJWT,
}
