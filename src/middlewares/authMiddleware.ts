import { Request, Response, NextFunction } from 'express'
import { AuthFailureError } from '../utils/errorResponse'
import { JwtUtil } from '../utils/jwtUtil'
import { AT_KEY } from '../controllers/userController'
import logger from '../utils/logger'
import { StatusCode } from '../utils/httpStatusCodes'
//Get and authorized accessToken receive from FE
const isAuthorized = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  //
  const accessTokenFromCookie = req.cookies?.accessToken
  console.log('accessTokenFromCookie: ', accessTokenFromCookie)
  console.log('---')
  if (!accessTokenFromCookie) {
    throw new AuthFailureError('Unauthorized! (Token not found)')
  }

  try {
    const accessTokenDecoded = await JwtUtil.verifyToken(
      accessTokenFromCookie,
      AT_KEY,
    )
    logger.info(accessTokenDecoded)
    // req.jwtDecoded = accessTokenDecoded
    next()
  } catch (error: any) {
    if (error.message?.includes('jwt expired')) {
      throw new AuthFailureError('Need use refresh token', StatusCode.GONE)
    }

    throw new AuthFailureError('Unauthorized! Please login...')
  }
}

export const authMiddleware = {
  isAuthorized,
}
