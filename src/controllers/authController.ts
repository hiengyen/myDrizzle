import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { Request, Response, NextFunction } from 'express'
import { db } from '../dbs/db'
import { UsersTable } from '../dbs/schema'
import { and, eq } from 'drizzle-orm'
import { compareSync, hashSync } from 'bcrypt'
import { BadRequestError } from '../utils/errorResponse'
import * as jwt from 'jsonwebtoken'
import { find } from 'lodash'
import logger from '../utils/logger'
export const SECRET_KEY = process.env.SECRET_KEY!

export const signUpHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { name, email, password, role } = req.body

    const holderUser = await db.query.UsersTable.findFirst({
      where: eq(UsersTable.email, email),
    })

    if (holderUser) {
      throw new BadRequestError('User already register !')
    }

    const newUser = await db.insert(UsersTable).values({
      name,
      email,
      password: hashSync(password, 10),
      role,
    })
    res.send(newUser)
  } catch (error) {
    next(error)
  }
}

export const logInHandler = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const findUser = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.email, email),
  })
  if (!findUser) {
    throw new BadRequestError('User does not exists !')
  }
  if (!compareSync(findUser.password, password)) {
    throw new BadRequestError('Invalid password !')
  }
}

export const logOutHandler = async (req: Request, res: Response) => {
  const { userId } = req.body

  const result = await db.delete(UsersTable).where(eq(UsersTable.id, userId))
  res.json(result)
}
