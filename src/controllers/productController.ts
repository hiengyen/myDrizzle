import { CategoryTable } from './../dbs/schema'
import dotenv from 'dotenv'
dotenv.config({ path: '.env' })
import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'
import logger from '../utils/logger'
import {
  ProductFullJoinDTO,
  ProductInsertDTO,
  ProductUpdateDTO,
} from '../dto/productDTO'
import productService from '../services/productService'
import { BadRequestError } from '../errors/BadRequestError'

const createProductHandler = async (req: Request, res: Response) => {
  const productPayload: ProductInsertDTO = req.body
  if (!productPayload) {
    logger.error('Create product failure: request missing some attrs in body')
    throw new BadRequestError('Request missing some attrs in body')
  }

  await productService.createProduct(productPayload)

  res.status(StatusCodes.CREATED).json({
    message: 'Create product succeed',
  })
}

const updateProductHandler = async (req: Request, res: Response) => {
  const productID: string = req.params.id
  const productPayload: ProductUpdateDTO = req.body

  if (!productPayload) {
    logger.error('Update product failure: request missing some attrs in body')
    throw new BadRequestError('Request missing some attrs in body')
  }

  if (!(await productService.checkProductExisting(productID))) {
    logger.error('Update product failure: product not found')
    throw new BadRequestError('Product not found')
  }
  await productService.updateProduct(productPayload, productID)

  res.status(StatusCodes.OK).json({
    message: 'Update product succeed',
  })
}

const getSpecificIDs = async (req: Request, res: Response) => {
  const productIDs: string[] | undefined = req.body

  if (!productIDs) {
    logger.error('Get products failure: request missing some attrs in body')
    throw new BadRequestError('Request missing some attrs in body')
  }

  const data = await productService.getProductsFullJoinWithID(productIDs)

  res.status(StatusCodes.OK).json({
    message: 'Update product succeed',
    info: data,
  })
}

const deleteProductHandler = async (req: Request, res: Response) => {
  const productID: string = req.params.id

  if (!(await productService.checkProductExisting(productID))) {
    logger.error('Delete product failure: product not found')
    throw new BadRequestError('Product not found')
  }

  logger.info('Delete product: valid product')
  const deletedIDs: string[] = await productService.deleteProduct(productID)

  res.status(StatusCodes.OK).json({
    message: 'Delete product succeed',
    info: deletedIDs,
  })
}

const getProducts = async (req: Request, res: Response) => {
  const categoryID = req.query.categoryID as string
  const providerID = req.query.providerID as string
  const detail = req.query.detail as string
  let payload = null
  if (categoryID) {
    payload = await productService.getProductWithCategoryID(categoryID)
  } else if (providerID) {
    payload = await productService.getProductWithProviderID(providerID)
  } else if (detail) {
    payload = await productService.getProductsFullJoin()
  } else {
    payload = await productService.getProductsSummary()
  }
  logger.info(`Get products succeed`)
  res.status(StatusCodes.OK).json({
    message: 'Get products succeed',
    info: payload,
  })
}

const getProduct = async (req: Request, res: Response) => {
  const productID: string = req.params.id

  if (!(await productService.checkProductExisting(productID))) {
    logger.error('Delete product failure: product not found')
    throw new BadRequestError('Product not found')
  }

  const product: ProductFullJoinDTO =
    await productService.getProductFullJoinDTO(productID)

  logger.info(`Get product succeed`)
  res.status(StatusCodes.OK).json({
    message: 'Get product succeed',
    info: product,
  })
}

const getManyProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {}

export default {
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
  getProducts,
  getProduct,
  getManyProduct,
  getSpecificIDs,
}
