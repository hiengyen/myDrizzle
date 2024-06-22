import { db } from '../dbs/db'
import { UsersTable } from '../dbs/schema'
import { eq, sql } from 'drizzle-orm'
import { compareSync, hashSync } from 'bcrypt'
import { StatusCodes } from 'http-status-codes'
import { ErrorResponse } from '../utils/error.response'
import {
  RefreshTokenUseds,
  UserResponseDTO,
  UserUpdateDTO,
  User,
  UserInsertDTO,
} from '../dto/userDTO'
import logger from '../utils/logger'

const getUserResponseByEmail = async (
  email: string
): Promise<UserResponseDTO | undefined> => {
  const holderUser: UserResponseDTO | undefined =
    await db.query.UsersTable.findFirst({
      where: eq(UsersTable.email, email),
    })
  return holderUser
}

const getUserByEmail = async (email: string): Promise<User | undefined> => {
  const holderUser: User | undefined = await db.query.UsersTable.findFirst({
    where: eq(UsersTable.email, email),
  })
  return holderUser
}

const getValidUser = async (
  email: string,
  password: string
): Promise<UserResponseDTO> => {
  const findByEmail: User | undefined = await getUserByEmail(email)

  if (!findByEmail) {
    throw new ErrorResponse(
      `User with ${email} does not exist `,
      StatusCodes.BAD_REQUEST,
      `User with ${email} does not exist `
    )
  }

  // Check whether password is valid
  const match = compareSync(password, findByEmail.password)
  if (!match) {
    throw new ErrorResponse(
      'Wrong password',
      StatusCodes.UNAUTHORIZED,
      `Wrong password`
    )
  }

  const userResponseDTO: UserResponseDTO = {
    id: findByEmail.id,
    name: findByEmail.name,
    email: findByEmail.email,
    phoneNum: findByEmail.phoneNum,
    avatar: findByEmail.avatar,
    role: findByEmail.role,
    createdAt: findByEmail.createdAt,
    updateAt: findByEmail.updateAt,
  }
  return userResponseDTO
}

const getUserResponseByID = async (
  userID: string
): Promise<UserResponseDTO | undefined> => {
  const holderUser: UserResponseDTO | undefined =
    await db.query.UsersTable.findFirst({
      where: eq(UsersTable.id, userID),
    })
  return holderUser
}

const insertNewUser = async (user: UserInsertDTO) => {
  await db.insert(UsersTable).values({
    email: user.email,
    name: user.name,
    role: user.role,
    password: hashSync(user.password, 10),
  })
}

const updateUserInfo = async (
  user: UserUpdateDTO,
  userID: string
): Promise<UserResponseDTO[]> => {
  const resUser: UserResponseDTO[] = await db
    .update(UsersTable)
    .set({
      name: user.name,
      email: user.email,
      phoneNum: user.phoneNum,
      avatar: user.avatar,
    })
    .where(eq(UsersTable.id, userID))
    .returning({
      id: UsersTable.id,
      name: UsersTable.name,
      email: UsersTable.email,
      phoneNum: UsersTable.phoneNum,
      avatar: UsersTable.avatar,
      role: UsersTable.role,
      createdAt: UsersTable.createdAt,
      updateAt: UsersTable.updateAt,
    })
  return resUser
}

const checkEmailInUsed = async (
  email: string,
  userID: string
): Promise<boolean> => {
  const holderUsers: UserResponseDTO[] = await db.query.UsersTable.findMany({
    where: eq(UsersTable.email, email),
  })

  const result = holderUsers.find(
    user => user.email === email && user.id !== userID
  )
  return result !== undefined
}

const getUserRefreshTokenUsed = async (
  userID: string
): Promise<RefreshTokenUseds | undefined> => {
  const refreshTokenUseds: RefreshTokenUseds | undefined =
    await db.query.UsersTable.findFirst({
      columns: { refreshTokenUsed: true },
      where: eq(UsersTable.id, userID),
    })
  return refreshTokenUseds
}

const deleteRefreshToken = async (refreshToken: string, userID: string) => {
  const userData: RefreshTokenUseds | undefined = await getUserRefreshTokenUsed(
    userID
  )

  if (!userData) {
    throw new ErrorResponse(
      'User none exist',
      StatusCodes.BAD_REQUEST,
      'User none exist'
    )
  }

  //Delete current refresh token from DB if it exist
  if (userData.refreshTokenUsed) {
    const newRefreshTokenBucket: string[] = userData.refreshTokenUsed.filter(
      token => token !== refreshToken
    )
    await db
      .update(UsersTable)
      .set({
        refreshTokenUsed: !newRefreshTokenBucket.length
          ? null
          : newRefreshTokenBucket,
      })
      .where(eq(UsersTable.id, userID))
  }
}

const pushRefreshToken = async (refreshToken: string, userID: string) => {
  await db
    .update(UsersTable)
    .set({
      refreshTokenUsed: sql`array_append(${UsersTable.refreshTokenUsed}, ${refreshToken})`,
    })
    .where(eq(UsersTable.id, userID))
}

const clearUserRefreshTokenUsed = async (userID: string) => {
  await db
    .update(UsersTable)
    .set({
      refreshTokenUsed: null,
    })
    .where(eq(UsersTable.id, userID))
}

export default {
  getValidUser,
  getUserResponseByEmail,
  getUserResponseByID,
  insertNewUser,
  getUserRefreshTokenUsed,
  deleteRefreshToken,
  pushRefreshToken,
  clearUserRefreshTokenUsed,
  checkEmailInUsed,
  updateUserInfo,
}
