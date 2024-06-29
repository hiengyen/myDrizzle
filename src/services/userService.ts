import { BadRequestError } from './../errors/BadRequestError'
import { db } from '../dbs/db'
import { eq, sql } from 'drizzle-orm'
import { compareSync, hashSync } from 'bcrypt'
import { StatusCodes } from 'http-status-codes'
import {
  RefreshTokenUseds,
  UserResponseDTO,
  UserUpdateDTO,
  UserDTO,
  UserInsertDTO,
  UserResponseSummaryDTO,
} from '../dto/userDTO'
import logger from '../utils/logger'
import { UserTable, SelectUser } from '../dbs/schema'

const getUserResponseByEmail = async (
  email: string,
): Promise<UserResponseDTO | undefined> => {
  const holderUser: UserResponseDTO | undefined =
    await db.query.UserTable.findFirst({
      columns: {
        userID: true,
        userName: true,
        email: true,
        phoneNum: true,
        avatar: true,
        role: true,
        createdAt: true,
        updateAt: true,
      },
      where: eq(UserTable.email, email),
    })
  return holderUser
}

const getUserByEmail = async (email: string): Promise<UserDTO | undefined> => {
  const holderUser: UserDTO | undefined = await db.query.UserTable.findFirst({
    where: eq(UserTable.email, email),
  })
  return holderUser
}

const getValidUserResponseSummary = async (
  email: string,
  password: string,
): Promise<UserResponseSummaryDTO> => {
  const findByEmail: UserDTO | undefined = await getUserByEmail(email)

  if (!findByEmail) {
    throw new BadRequestError(`User with ${email} does not exist `)
  }

  // Check whether password is valid
  const match = compareSync(password, findByEmail.password)
  if (!match) {
    throw new BadRequestError('Wrong password')
  }

  const user: UserResponseSummaryDTO = {
    userID: findByEmail.userID,
    userName: findByEmail.userName,
    avatar: findByEmail.avatar,
    role: findByEmail.role,
  }
  return user
}

const getUserResponseByID = async (
  userID: string,
): Promise<UserResponseDTO | undefined> => {
  const holderUser: UserResponseDTO | undefined =
    await db.query.UserTable.findFirst({
      columns: {
        userID: true,
        userName: true,
        email: true,
        phoneNum: true,
        avatar: true,
        role: true,
        createdAt: true,
        updateAt: true,
      },
      where: eq(UserTable.userID, userID),
    })
  return holderUser
}

const getUserResponseSummaryByID = async (
  userID: string,
): Promise<UserResponseSummaryDTO | undefined> => {
  const holderUser: UserResponseSummaryDTO | undefined =
    await db.query.UserTable.findFirst({
      columns: { userID: true, userName: true, avatar: true, role: true },
      where: eq(UserTable.userID, userID),
    })
  return holderUser
}

const insertNewUser = async (user: UserInsertDTO) => {
  await db.insert(UserTable).values({
    email: user.email,
    userName: user.userName,
    role: user.role,
    password: hashSync(user.password, 10),
  })
}

const updateUserInfo = async (
  user: UserUpdateDTO,
): Promise<UserResponseDTO[]> => {
  const resUser: UserResponseDTO[] = await db
    .update(UserTable)
    .set({ ...user })
    .where(eq(UserTable.userID, user.userID))
    .returning({
      userID: UserTable.userID,
      userName: UserTable.userName,
      email: UserTable.email,
      phoneNum: UserTable.phoneNum,
      avatar: UserTable.avatar,
      role: UserTable.role,
      createdAt: UserTable.createdAt,
      updateAt: UserTable.updateAt,
    })
  return resUser
}

/**
 * Check if input email had been used by another user or not
 *
 * @param email
 * @param userID
 * @returns true if email has been used, false if not
 */
const checkEmailInUsed = async (
  email: string,
  userID: string,
): Promise<boolean> => {
  const holderUsers: UserResponseDTO[] = await db.query.UserTable.findMany({
    where: eq(UserTable.email, email),
  })

  const result: UserResponseDTO | undefined = holderUsers.find(
    user => user.email === email && user.userID !== userID,
  )
  logger.info(`result: ${result}`)
  return result !== undefined
}

const getUserRefreshTokenUsed = async (
  userID: string,
): Promise<RefreshTokenUseds | undefined> => {
  const refreshTokenUseds: RefreshTokenUseds | undefined =
    await db.query.UserTable.findFirst({
      columns: { refreshTokenUsed: true },
      where: eq(UserTable.userID, userID),
    })

  logger.error(`Refreshtoken bucket : ${refreshTokenUseds}`)
  return refreshTokenUseds
}

const deleteRefreshToken = async (refreshToken: string, userID: string) => {
  const userData: RefreshTokenUseds | undefined =
    await getUserRefreshTokenUsed(userID)

  if (!userData) {
    throw new BadRequestError('User none exist')
  }

  //Delete current refresh token from DB if it exist
  if (userData.refreshTokenUsed) {
    const newRefreshTokenBucket: string[] = userData.refreshTokenUsed.filter(
      token => token !== refreshToken,
    )
    await db
      .update(UserTable)
      .set({
        refreshTokenUsed: !newRefreshTokenBucket.length
          ? null
          : newRefreshTokenBucket,
      })
      .where(eq(UserTable.userID, userID))
  }
}

const pushRefreshToken = async (refreshToken: string, userID: string) => {
  await db
    .update(UserTable)
    .set({
      refreshTokenUsed: sql`array_append(${UserTable.refreshTokenUsed}, ${refreshToken})`,
    })
    .where(eq(UserTable.userID, userID))
}

const clearUserRefreshTokenUsed = async (userID: string) => {
  await db
    .update(UserTable)
    .set({
      refreshTokenUsed: null,
    })
    .where(eq(UserTable.userID, userID))
}

export default {
  getValidUserResponseSummary,
  getUserResponseByID,
  getUserResponseByEmail,
  getUserResponseSummaryByID,
  insertNewUser,
  getUserRefreshTokenUsed,
  deleteRefreshToken,
  pushRefreshToken,
  clearUserRefreshTokenUsed,
  checkEmailInUsed,
  updateUserInfo,
}
