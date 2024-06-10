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

export const SECRET_KEY = process.env.SECRET_KEY!

export const signup = async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body

  const holderUser = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.email, email),
  })

  if (holderUser) {
    throw new BadRequestError('Error:User already register !')
  }

  const newUser = await db.insert(UsersTable).values({
    name,
    email,
    password: hashSync(password, 10),
    role,
  })
  res.json(newUser)
}
export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body

  const findUser = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.email, email),
  })
  console.log(findUser)
  res.json({ findUser })
}
export const logout = async (req: Request, res: Response) => {
  const { userId } = req.body

  const result = await db.delete(UsersTable).where(eq(UsersTable.id, userId))
  res.json(result)
}