import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import JWT from 'jsonwebtoken'
import { UserInTokenPayloadDTO } from '../dto/userDTO'
import { AuthToken } from '../dto/enum'
import logger from '../utils/logger'
const AT_KEY: string | undefined = process.env.AT_SECRET_KEY
const RT_KEY: string | undefined = process.env.RT_SECRET_KEY

const generateToken = async (
  payload: any,
  secretSignature: string | undefined,
  tokenLife: string
): Promise<string> => {
  try {
    if (!secretSignature) {
      throw new Error('Secret token is undefined')
    }
    return JWT.sign(payload, secretSignature, {
      algorithm: 'HS256',
      expiresIn: tokenLife,
    })
  } catch (error) {
    throw new Error(`Generating token error: ${error}`)
  }
}

const verifyToken = async (
  token: string,
  secretSignature: string | undefined
) => {
  if (!secretSignature) {
    throw new Error('Secret token is undefined')
  }
  return JWT.verify(token, secretSignature)
}

const decodeToken = async (
  token: string
): Promise<string | JWT.JwtPayload | null> => {
  try {
    return JWT.decode(token)
  } catch (error: any) {
    throw new Error(`Decoding token error: ${error}`)
  }
}

const generateAuthToken = async (
  userInfo: UserInTokenPayloadDTO,
  tokenType: AuthToken,
  tokenLife: string
): Promise<string | undefined> => {
  const token: string | undefined = await generateToken(
    userInfo,
    tokenType === AuthToken.AccessToken ? AT_KEY : RT_KEY,
    tokenLife
  )
  return token
}

const verifyAuthToken = async (
  token: string,
  tokenType: AuthToken
): Promise<string | JWT.JwtPayload> => {
  const result: string | JWT.JwtPayload = await verifyToken(
    token,
    tokenType === AuthToken.AccessToken ? AT_KEY : RT_KEY
  )
  return result
}

export default {
  verifyAuthToken,
  decodeToken,
  generateAuthToken,
}
