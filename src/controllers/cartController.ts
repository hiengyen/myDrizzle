import { Request, Response } from 'express'
import { CategoryInsertDTO, CategoryDTO } from '../dto/categoryDTO'
import categoryService from '../services/categoryService'
import { StatusCodes } from 'http-status-codes'
import logger from '../utils/logger'
import { ConflictError } from '../errors/ConflictError'
import { BadRequestError } from '../errors/BadRequestError'

const createCategory = async (req: Request, res: Response) => {
  const newCategory: CategoryInsertDTO = {
    categoryName: req.body.name,
  }

  const categoryInDB: CategoryDTO[] = await categoryService.getCategoryByName(
    newCategory.categoryName
  )

  if (categoryInDB.length !== 0) {
    logger.error('Create category failure: category already exist')
    throw new ConflictError('Category already exist')
  }

  await categoryService.insertCategory(newCategory)

  logger.info(
    `Category: ${newCategory.categoryName} has been added successfull`
  )
  res.status(StatusCodes.CREATED).json({
    message: 'Create category success',
  })
}
