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

const updateCategory = async (req: Request, res: Response) => {
  const categoryReq: CategoryDTO = {
    categoryID: req.params.id,
    categoryName: req.body.name,
  }

  const categoryInDB: CategoryDTO[] = await categoryService.getCategoryByName(
    categoryReq.categoryName
  )

  if (categoryInDB.length !== 0) {
    logger.error('Update category failure: category already exist')
    throw new ConflictError('Category already exist')
  }

  const updatedCategory: CategoryDTO | undefined =
    await categoryService.updateCategory(categoryReq)

  if (!updatedCategory) {
    logger.error('Update category failure: category not found')
    throw new BadRequestError('Category not found')
  }

  logger.info(`Update category with id: ${categoryReq.categoryID} successfull`)
  res.status(StatusCodes.OK).json({
    message: 'Update category success',
  })
}

const deleteCategory = async (req: Request, res: Response) => {
  const categoryIDInReq: string = req.params.id

  const deletedCategoryID: string | undefined =
    await categoryService.deleteCategory(categoryIDInReq)

  if (!deletedCategoryID) {
    logger.error('Delete category failure: Category not found')
    throw new BadRequestError('Category not found')
  }

  logger.info(`Delete category with id: ${deletedCategoryID} successfull`)
  res.status(StatusCodes.OK).json({
    message: 'Delete category successfull',
  })
}

const getCategories = async (req: Request, res: Response) => {
  const categories: CategoryDTO[] | undefined =
    await categoryService.getCategories()

  logger.info(`Get categorys successfull`)
  return res.status(StatusCodes.OK).json({
    message: 'Get categorys successfull',
    info: categories,
  })
}
export default { createCategory, updateCategory, deleteCategory, getCategories }
