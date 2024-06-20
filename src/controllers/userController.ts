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
      message: 'Other error!',
    })
  }
}

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
    logger.info(userInfo)
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
      message: 'Other error!',
    })
  }
}

const logout = async (req: Request, res: Response) => {
  try {
    //Clear tokens in cookie
    const refreshTokenFromCookie: string = req.cookies?.refreshToken
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    const userIDInHeader: string | undefined = req.header('user-id')

    if (!userIDInHeader) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Request header lack of user id!',
      })
    }

    //Query all refresh tokens and delete current user's token
    const userData: { refreshTokenUsed: string[] | null } | undefined =
      await db.query.UsersTable.findFirst({
        columns: { refreshTokenUsed: true },
        where: eq(UsersTable.id, userIDInHeader),
      })

    if (userData?.refreshTokenUsed === null) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Refresh token none exists!',
      })
    }

    const refreshTokenBucket: string[] | undefined =
      userData?.refreshTokenUsed?.filter(
        token => token !== refreshTokenFromCookie
      )

    db.update(UsersTable).set({ refreshTokenUsed: refreshTokenBucket })

    return res.status(StatusCodes.OK).json({ message: 'Logout API success!' })
  } catch (error: any) {
    logger.error(error?.message)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Other error!',
    })
  }
}

const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshTokenFromCookie: string = req.cookies?.refreshToken
    const userIDInHeader: string = String(req.header('user-id'))

    //Get user information from db
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
    logger.info(userData)

    if (!userData.refreshTokenUsed) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        message: 'Refresh token none exists!',
      })
    }

    //Hacker's request: must clear all refresh token to login again
    if (
      !userData.refreshTokenUsed.find(token => token === refreshTokenFromCookie)
    ) {
      await db
        .update(UsersTable)
        .set({
          refreshTokenUsed: null,
        })
        .where(eq(UsersTable.id, userIDInHeader))
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'Malicios access!',
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

    return res
      .status(StatusCodes.OK)
      .json({
        message: 'Access Token API successed.',
      })
      .send(res)
  } catch (error: any) {
    logger.error(error?.message)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Other error!',
    })
  }
}

const updateInfo = async (req: Request, res: Response) => {
  try {
    const userID: string = String(req.header('user-id'))
    const userData: User = req.body

    // Check if email had been used for other account
    const holderUsers: { email: string; id: string }[] =
      await db.query.UsersTable.findMany({
        where: eq(UsersTable.email, userData.email),
      })
    // logger.info(holderUsers)

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

    return res.status(StatusCodes.OK).json({
      message: 'Update successed',
      infor: resUser,
    })
  } catch (error: any) {
    logger.error(`Update fail: \n${error?.message}`)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error)
  }
}

export const userController = {
  signup,
  login,
  logout,
  refreshToken,
  updateInfo,
}
