import { Request, Response, NextFunction } from 'express'
import { db } from '../dbs/db'
import { InsertUser, UsersTable } from '../dbs/schema'
import { eq } from 'drizzle-orm'
import { hashSync } from 'bcrypt'
import { BadRequestError } from '../utils/errorResponse'
export const signup = async (req: Request, res: Response) => {
  const { name, email, password, phoneNum, avatar, role } = req.body

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
    phoneNum,
    avatar,
    role,
  })
  res.json(newUser)
}
