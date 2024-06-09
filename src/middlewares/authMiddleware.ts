import { Response, Request, NextFunction } from 'express'
import { AuthFailureError } from '../utils/errorResponse'
import * as jwt from 'jsonwebtoken'
import { SECRET_KEY } from '../controllers/authController'
import { db } from '../dbs/db'
import { eq } from 'lodash'
import { UsersTable } from '../dbs/schema'
const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {}

export { authMiddleware }
