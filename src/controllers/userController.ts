import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { Request, Response, NextFunction } from 'express'
import { db } from '../dbs/db'
import { UsersTable } from '../dbs/schema'

import { and, eq, sql } from 'drizzle-orm'

import { compareSync, hashSync } from 'bcrypt'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import { JwtUtil } from '../utils/jwtUtil'
import ms from 'ms'
import logger from '../utils/logger'
import { User } from '../model/user'
import { JwtPayload } from 'jsonwebtoken'
import { UserInPayLoad } from '../model/jwt'
import { ErrorResponse } from '../utils/error.response'
import { BadRequestError } from '../errors/BadRequestError'

export const AT_KEY = process.env.AT_SECRET_KEY
export const RT_KEY = process.env.RT_SECRET_KEY

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
  // try {
  const { name, email, password, role } = req.body

  const holderUser: any = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.email, email),
  })

  if (holderUser) {
    throw new BadRequestError('User already exists')
  }
  const newUser = await db.insert(UsersTable).values({
    name,
    email,
    password: hashSync(password, 10),
    role,
  })
  logger.info(`User with email ${email} signed up successfull`)
  return res.status(StatusCodes.CREATED).json({
    message: 'Sign-up success',
  })

  // } catch (error: any) {
  //   logger.error('Sign up failure: ' + error.loggerMs && error?.message)
  //   if (error instanceof ErrorResponse) {
  //     return res.status(error.status).json({
  //       message: error.message,
  //     })
  //   }
  //   return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
  //     message: 'Cannot signup',
  //   })
  // }
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
    const accessTokenDecoded = await JwtUtil.verifyToken(
      accessTokenFromCookie,
      AT_KEY,
    )
    const refreshTokenDecoded = await JwtUtil.verifyToken(
      refreshTokenFromCookie,
      RT_KEY,
    )
    const userInToken: UserInPayLoad = refreshTokenDecoded as UserInPayLoad

    //Query all refresh tokens and delete current user's token
    const userData: { refreshTokenUsed: string[] | null } | undefined =
      await db.query.UsersTable.findFirst({
        columns: { refreshTokenUsed: true },
        where: eq(UsersTable.id, userInToken.id),
      })

    if (!userData) {
      logger.error('User none exists!')
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'User none exists!',
      })
    }

    // Check if refresh token already existed in DB
    if (userData.refreshTokenUsed) {
      const newRefreshTokenBucket: string[] = userData.refreshTokenUsed.filter(
        token => token === refreshTokenFromCookie,
      )
      if (newRefreshTokenBucket.length === 0) {
        throw new Error()
      }
    } else {
      throw new Error()
    }

    logger.info(`User already been login`)
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'User already been login !',
    })
  } catch (error: any) {
    // Main logic of login
    try {
      logger.info(`loging in...`)
      const findByEmail: any = await db.query.UsersTable.findFirst({
        where: and(eq(UsersTable.email, req.body.email)),
      })

      if (!findByEmail) {
        throw new ErrorResponse(
          `Wrong email`,
          StatusCodes.BAD_REQUEST,
          `User with ${req.body.email} does not exist `,
        )
      }

      // Check whether password is valid
      const match = compareSync(req.body.password, findByEmail.password)
      if (!match) {
        throw new ErrorResponse(
          'Wrong password',
          StatusCodes.BAD_REQUEST,
          `Wrong password`,
        )
      }

      const userInfo: any = {
        id: findByEmail.id,
        role: findByEmail.role,
      }

      //create AT, RT
      const accessToken: string | undefined = await JwtUtil.generateToken(
        userInfo,
        AT_KEY,
        '5 minutes',
      )

      const refreshToken: string | undefined = await JwtUtil.generateToken(
        userInfo,
        RT_KEY,
        '14 days',
      )

      if (!accessToken || !refreshToken) {
        throw new ErrorResponse(
          'Token error',
          StatusCodes.BAD_REQUEST,
          `Cannot create token`,
        )
      }

      //set two token to cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: ms('14 days'),
      })

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: ms('14 days'),
      })

      //set refresh token to db
      const newUser = await db
        .update(UsersTable)
        .set({
          refreshTokenUsed: sql`array_append(${UsersTable.refreshTokenUsed}, ${refreshToken})`,
        })
        .where(eq(UsersTable.id, userInfo.id))

      //return info to store in LocalStorage
      return res.status(StatusCodes.OK).json({
        message: 'Login API successed',
        info: {
          name: findByEmail.name,
          email: findByEmail.email,
          avt: findByEmail.avt,
          phoneNumber: findByEmail.phoneNum,
          createAt: findByEmail.createAt,
          updateAt: findByEmail.updateAt,
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
      await JwtUtil.decodeToken(refreshTokenFromCookie)
    if (!refreshTokenDecoded) {
      throw new ErrorResponse(
        'Missing token',
        StatusCodes.BAD_REQUEST,
        'Missing refresh token',
      )
    }
    const userInToken: UserInPayLoad = refreshTokenDecoded as UserInPayLoad

    //Query all refresh tokens and delete current user's token
    const userData: { refreshTokenUsed: string[] | null } | undefined =
      await db.query.UsersTable.findFirst({
        columns: { refreshTokenUsed: true },
        where: eq(UsersTable.id, userInToken.id),
      })

    if (!userData) {
      throw new ErrorResponse(
        'User none exist',
        StatusCodes.BAD_REQUEST,
        'User none exist',
      )
    }

    //Delete current refresh token from DB if it exist
    if (userData.refreshTokenUsed) {
      const newRefreshTokenBucket: string[] = userData.refreshTokenUsed.filter(
        token => token !== refreshTokenFromCookie,
      )
      await db
        .update(UsersTable)
        .set({
          refreshTokenUsed:
            newRefreshTokenBucket.length === 0 ? null : newRefreshTokenBucket,
        })
        .where(eq(UsersTable.id, userInToken.id))
    }

    logger.info('Logout success')
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
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
    const userIDInHeader: string = String(req.header('user-id'))

    //Get user information from db (refreshTokenUsed and role)
    const userData:
      | { refreshTokenUsed: string[] | null; role: string }
      | undefined = await db.query.UsersTable.findFirst({
      columns: { refreshTokenUsed: true, role: true },
      where: eq(UsersTable.id, userIDInHeader),
    })

    if (!userData) {
      logger.error('User none exists!')
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'User none exists!',
      })
    }

    //Hacker's request: must clear all refresh token to login again
    if (
      !userData.refreshTokenUsed ||
      !userData.refreshTokenUsed.find(token => token === refreshTokenFromCookie)
    ) {
      logger.error(
        'Unknown refresh token: auto clear all refresh token in database.',
      )
      await db
        .update(UsersTable)
        .set({
          refreshTokenUsed: null,
        })
        .where(eq(UsersTable.id, userIDInHeader))
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Invalid token!',
      })
    }

    //Down here token must be valid
    //Create new AT
    const userInfo: UserInPayLoad = {
      id: userIDInHeader,
      role: userData.role,
    }
    const accessToken: any = await JwtUtil.generateToken(
      userInfo,
      AT_KEY,
      '5 minutes',
    )
    res.cookie('accessToken', accessToken, {
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
    const userID: string = String(req.header('user-id'))
    const userData: User = req.body

    // Check if email had been used for other account
    const holderUsers: { email: string; id: string }[] =
      await db.query.UsersTable.findMany({
        where: eq(UsersTable.email, userData.email),
      })

    if (
      holderUsers?.find(
        user => user.email === userData.email && user.id !== userID,
      )
    ) {
      throw new ErrorResponse(
        'This email is being used by another account',
        StatusCodes.BAD_REQUEST,
        'This email has already been registeree',
      )
    }

    const resUser = await db
      .update(UsersTable)
      .set({
        name: userData.name,
        email: userData.email,
        phoneNum: userData.phoneNum,
        avatar: userData.avatar,
      })
      .where(eq(UsersTable.id, userID))
      .returning({
        name: UsersTable.name,
        email: UsersTable.email,
        avatar: UsersTable.avatar,
        createdAt: UsersTable.createdAt,
      })

    logger.info(`Update user information successed`)
    return res.status(StatusCodes.OK).json({
      message: 'Update successed',
      infor: resUser,
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

export const userController = {
  signup,
  login,
  logout,
  refreshToken,
  updateInfo,
}
