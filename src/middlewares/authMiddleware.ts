import { Request, Response, NextFunction } from 'express'
import { JwtUtil } from '../utils/jwtUtil'
import { AT_KEY } from '../controllers/userController'
import logger from '../utils/logger'
import { StatusCodes } from 'http-status-codes'
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
    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'Unauthorized! (Token not found)',
    })
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
      return res.status(StatusCodes.FORBIDDEN).json({
        message: 'Unauthorized! (Token not found)',
      })
    }

    return res.status(StatusCodes.FORBIDDEN).json({
      message: 'Unauthorized! (Please login ...)',
    })
  }
}

export const authMiddleware = {
  isAuthorized,
}
