import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { Request, Response, NextFunction } from 'express'
import { db } from '../dbs/db'
import { ProductTable, ProductItemTable } from '../dbs/schema'

import { and, eq, sql } from 'drizzle-orm'

import { compareSync, hashSync } from 'bcrypt'
import { StatusCodes, ReasonPhrases } from 'http-status-codes'
import logger from '../utils/logger'
import { ProductDTO } from '../dto/productDTO'
import { productService } from '../services/productService'
import { BadRequestError } from '../errors/BadRequestError'
import { ConflictError } from '../errors/ConflictError'

const createProductHandler = async (req: Request, res: Response) => {
  const productPayload: ProductDTO = {
    ...req.body,
  }

  try {
    const newProduct = await productService.createProduct(productPayload)

    res.status(StatusCodes.CREATED).json({
      message: 'Create Product success',
      info: newProduct,
    })
  } catch (error) {
    logger.error(error)
  }
}

const updateProductHandler = async (req: Request, res: Response) => {
  const productPayload: ProductDTO = {
    productID: req.params.id,
    ...req.body,
  }
  await productService.updateProduct(productPayload)

  logger.info(`Update provider with id: ${req.params.id} successfull`)
  res.status(StatusCodes.OK).json({
    message: 'Update product success',
  })
}

const deleteProductHandler = async (req: Request, res: Response) => {
  const deleteProduct: unknown = await productService.deleteProduct(
    req.params.id,
  )
  if (!deleteProduct) {
    logger.error('Delete provider failure: provider not found')
    throw new ConflictError('Provider not found')
  }

  logger.info(`Delete provider with id: ${req.params.id} successfull`)
  res.status(StatusCodes.OK).json({
    message: 'Delete provider successfull',
  })
}

const getOneProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {}

const getManyProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {}

export const productController = {
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  getOneProduct,
  getManyProduct,
}
