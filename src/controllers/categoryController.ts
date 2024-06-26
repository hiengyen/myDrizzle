import { Request, Response } from 'express'
import {
  CategoryInsertDTO,
  CategoryUpdateDTO,
  CategoryDTO,
} from '../dto/categoryDTO'
import categoryService from '../services/categoryService'
import { ErrorResponse } from '../utils/error.response'
import { StatusCodes } from 'http-status-codes'
import logger from '../utils/logger'

const createCategory = async (req: Request, res: Response) => {
  try {
    const newCategory: CategoryInsertDTO = req.body

    const categoryInDB: CategoryDTO[] = await categoryService.getCategoryByName(
      newCategory.name
    )

    if (categoryInDB.length !== 0) {
      throw new ErrorResponse(
        'Category already exist',
        StatusCodes.CONFLICT,
        'Category already exist'
      )
    }

    await categoryService.insertCategory(newCategory)

    logger.info(`Category: ${newCategory.name} has been added successful`)
    return res.status(StatusCodes.CREATED).json({
      message: 'Create category success',
    })
  } catch (error: any) {
    logger.error('Create category failure: ' + error.loggerMs && error?.message)
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Create category failure',
    })
  }
}

const updateCategory = async (req: Request, res: Response) => {
  try {
    const categoryReq: CategoryUpdateDTO = {
      id: req.params.id,
      name: req.body.name,
    }

    const categoryInDB: CategoryDTO[] = await categoryService.getCategoryByName(
      categoryReq.name
    )

    if (categoryInDB.length !== 0) {
      throw new ErrorResponse(
        'Category already existed',
        StatusCodes.CONFLICT,
        'Category already existed'
      )
    }

    const updatedCategory: CategoryDTO | undefined =
      await categoryService.updateCategory(categoryReq)

    if (!updatedCategory) {
      throw new ErrorResponse(
        'Category not found',
        StatusCodes.BAD_REQUEST,
        'Category not found'
      )
    }

    logger.info(`Update category with id: ${categoryReq.id} successfull`)
    return res.status(StatusCodes.OK).json({
      message: 'Update category success',
    })
  } catch (error: any) {
    logger.error('Update category failure: ' + error.loggerMs && error?.message)
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Update category failure',
    })
  }
}

const deleteCategory = async (req: Request, res: Response) => {
  try {
    const categoryIDInReq: string = req.params.id

    const deletedCategoryID: string | undefined =
      await categoryService.deleteCategory(categoryIDInReq)

    if (!deletedCategoryID) {
      throw new ErrorResponse(
        'Category not found',
        StatusCodes.CONFLICT,
        'Category not found'
      )
    }

    logger.info(`Delete category with id: ${deletedCategoryID} successfull`)
    return res.status(StatusCodes.OK).json({
      message: 'Delete category successfull',
    })
  } catch (error: any) {
    logger.error('Delete category failure: ' + error.loggerMs && error?.message)
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Delete failure',
    })
  }
}

const getCategorys = async (req: Request, res: Response) => {
  try {
    const categorys: CategoryDTO[] | undefined =
      await categoryService.getCategorys()

    logger.info(`Get categorys successfull`)
    return res.status(StatusCodes.OK).json({
      message: 'Get categorys successfull',
      info: categorys,
    })
  } catch (error: any) {
    logger.error('Get categorys failure: ' + error?.message)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Get categorys failure',
    })
  }
}
export default { createCategory, updateCategory, deleteCategory, getCategorys }
