import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { Request, Response, NextFunction } from 'express'
import { db } from '../dbs/db'
import { UsersTable } from '../dbs/schema'
import { SQL, and, eq, sql } from 'drizzle-orm'
import { compareSync, hashSync } from 'bcrypt'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import { JwtUtil } from '../utils/jwtUtil'
import ms from 'ms'
import logger from '../utils/logger'
import { User } from '../model/user'
import { isUser } from '../utils/typeGuard'
import { JwtPayload } from 'jsonwebtoken'
import { UserInPayLoad } from '../model/jwt'

export const AT_KEY = process.env.AT_SECRET_KEY
export const RT_KEY = process.env.RT_SECRET_KEY
const signup = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role } = req.body

    const holderUser: any = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.email, email),
    })

    if (holderUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'User already exist !',
      })
    }

    const newUser = await db.insert(UsersTable).values({
      name,
      email,
      password: hashSync(password, 10),
      role,
    })

    return res.status(StatusCodes.CREATED).json({
      message: 'Sign-up API success',
    })
  } catch (error: any) {
    logger.error(error?.message)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Cannot signup!',
    })
  }
}

const login = async (req: Request, res: Response, next: NextFunction) => {
  const accessTokenFromCookie = req.cookies?.accessToken
  const refreshTokenFromCookie = req.cookies?.refreshToken

  try {
    const accessTokenDecoded = await JwtUtil.verifyToken(
      accessTokenFromCookie,
      AT_KEY
    )
    const refreshTokenDecoded = await JwtUtil.verifyToken(
      refreshTokenFromCookie,
      RT_KEY
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

    if (userData.refreshTokenUsed) {
      const newRefreshTokenBucket: string[] = userData.refreshTokenUsed.filter(
        token => token === refreshTokenFromCookie
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
    try {
      logger.info(`login...`)
      // Search with email
      const findByEmail: any = await db.query.UsersTable.findFirst({
        where: and(eq(UsersTable.email, req.body.email)),
      })

      if (!findByEmail) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: 'User does not exist !',
        })
      }

      // Check whether password is valid
      const match = compareSync(req.body.password, findByEmail.password)
      if (!match) {
        return res.status(StatusCodes.FORBIDDEN).json({
          message: 'Invalid password !',
        })
      }

      const userInfo: any = {
        id: findByEmail.id,
        role: findByEmail.role,
      }

      //create AT, RT
      const accessToken: any = await JwtUtil.generateToken(
        userInfo,
        AT_KEY,
        '5 minutes'
      )

      const refreshToken: any = await JwtUtil.generateToken(
        userInfo,
        RT_KEY,
        '14 days'
      )

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
      logger.error(error?.message)
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
      throw new Error('Missing refresh Token')
    }
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

    //Delete current refresh token from DB if it exist
    if (userData.refreshTokenUsed) {
      logger.info(`Delete current refresh token:\n ${refreshTokenFromCookie}`)
      logger.info(`refresh token list before:\n ${userData.refreshTokenUsed}`)
      const newRefreshTokenBucket: string[] = userData.refreshTokenUsed.filter(
        token => token !== refreshTokenFromCookie
      )
      logger.info(`refresh token list after:\n ${newRefreshTokenBucket}`)
      // const finalSql: SQL = sql.join(newRefreshTokenBucket, sql.raw(' '))

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
    logger.error(error?.message)
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
        'Unknown refresh token: auto clear all refresh token in database.'
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
      '5 minutes'
    )
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days'),
    })

    logger.info('New accessToken: ' + accessToken)
    return res.status(StatusCodes.OK).json({
      message: 'Access Token API successed.',
    })
  } catch (error: any) {
    logger.error(error?.message)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Cannot refresh!',
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
        user => user.email === userData.email && user.id !== userID
      )
    ) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'This email is being used by another account!',
      })
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
    logger.error(`Update fail: \n${error?.message}`)
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
