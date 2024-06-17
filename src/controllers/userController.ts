import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { Request, Response, NextFunction } from 'express'
import { db } from '../dbs/db'
import { UsersTable } from '../dbs/schema'
import { and, eq } from 'drizzle-orm'
import { compareSync, hashSync } from 'bcrypt'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import { JwtUtil } from '../utils/jwtUtil'
import ms from 'ms'

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
        metadata: {
          info: {
            name: holderUser.name,
            email: holderUser.email,
            phoneNum: holderUser.phoneNum,
            avatar: holderUser.avatar,
            role: holderUser.role,
            createAt: holderUser.createAt,
            updateAt: holderUser.updateAt,
          },
        },
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
      info: newUser,
    })
  } catch (error) {
    console.log(error)
  }
}
const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const findByEmail: any = await db.query.UsersTable.findFirst({
      where: and(eq(UsersTable.email, req.body.email)),
    })

    if (!findByEmail) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: 'User does not exist !',
      })
    }
    const userInfo: any = {
      id: await findByEmail.id,
      email: await findByEmail.email,
    }

    //create AT, RT
    const accessToken: any = await JwtUtil.generateToken(userInfo, AT_KEY, '1h')

    const refreshToken: any = await JwtUtil.generateToken(
      userInfo,
      RT_KEY,
      '14 days',
    )

    //set cookie
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

    const match = compareSync(req.body.password, findByEmail.password)
    if (!match) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Invalid password !',
      })
    }
    //return info for store in LocalStorage
    return res.status(StatusCodes.OK).json({
      message: 'Login API success',
      metadata: {
        info: {
          name: findByEmail.name,
          email: findByEmail.email,
          role: findByEmail.role,
          createAt: findByEmail.createAt,
          updateAt: findByEmail.updateAt,
        },
        accessToken,
        refreshToken,
      },
    })
  } catch (error: any) {
    console.log(error)
  }
}

const logout = async (req: Request, res: Response) => {
  try {
    res.clearCookie('accessToken')
    res.status(StatusCodes.OK).json({ message: 'Logout API success!' })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json(error)
  }
}

const refreshToken = async (req: Request, res: Response) => {
  try {
    const refreshTokenFromCookie = req.cookies?.refreshToken

    const refreshTokenDecoded: any = await JwtUtil.verifyToken(
      refreshTokenFromCookie,
      RT_KEY,
    )

    //create new AT

    const userInfo: any = {
      id: refreshTokenDecoded.id,
      email: refreshTokenDecoded.email,
    }

    //create new AT
    const accessToken: any = await JwtUtil.generateToken(userInfo, AT_KEY, '1h')

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days'),
    })

    //
    return res
      .status(StatusCodes.OK)
      .json({
        message: 'Refresh Token API success.',
        metadata: {
          accessToken: accessToken,
        },
      })
      .send(res)
  } catch (error: any) {
    console.log(error)
  }
}

export const userController = {
  signup,
  login,
  logout,
  refreshToken,
}
