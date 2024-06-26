import { Request, Response } from 'express'
import {
  ProviderInsertDTO,
  ProviderUpdateDTO,
  ProviderDTO,
} from '../dto/providerDTO'
import providerService from '../services/providerService'
import { ErrorResponse } from '../utils/error.response'
import { StatusCodes } from 'http-status-codes'
import logger from '../utils/logger'

const createProvider = async (req: Request, res: Response) => {
  try {
    const newProvider: ProviderInsertDTO = req.body

    const providerInDB: ProviderDTO[] = await providerService.getProviderByName(
      newProvider.name
    )

    if (providerInDB.length !== 0) {
      throw new ErrorResponse(
        'Provider already exist',
        StatusCodes.CONFLICT,
        'Provider already exist'
      )
    }

    await providerService.insertProvider(newProvider)

    logger.info(`Provider: ${newProvider.name} has been added successful`)
    return res.status(StatusCodes.CREATED).json({
      message: 'Create provider success',
    })
  } catch (error: any) {
    logger.error('Create provider failure: ' + error.loggerMs && error?.message)
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Create provider failure',
    })
  }
}

const updateProvider = async (req: Request, res: Response) => {
  try {
    const providerReq: ProviderUpdateDTO = {
      id: req.params.id,
      name: req.body.name,
    }

    const providerInDB: ProviderDTO[] = await providerService.getProviderByName(
      providerReq.name
    )

    if (providerInDB.length !== 0) {
      throw new ErrorResponse(
        'Provider already existed',
        StatusCodes.CONFLICT,
        'Provider already existed'
      )
    }

    const updatedProvider: ProviderDTO | undefined =
      await providerService.updateProvider(providerReq)

    if (!updatedProvider) {
      throw new ErrorResponse(
        'Provider not found',
        StatusCodes.BAD_REQUEST,
        'Provider not found'
      )
    }

    logger.info(`Update provider with id: ${providerReq.id} successfull`)
    return res.status(StatusCodes.OK).json({
      message: 'Update provider success',
    })
  } catch (error: any) {
    logger.error('Update provider failure: ' + error.loggerMs && error?.message)
    if (error instanceof ErrorResponse) {
      return res.status(error.status).json({
        message: error.message,
      })
    }
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Update provider failure',
    })
  }
}

const deleteProvider = async (req: Request, res: Response) => {
  try {
    const providerIDInReq: string = req.params.id

    const deletedProviderID: string | undefined =
      await providerService.deleteProvider(providerIDInReq)

    if (!deletedProviderID) {
      throw new ErrorResponse(
        'Provider not found',
        StatusCodes.CONFLICT,
        'Provider not found'
      )
    }

    logger.info(`Delete provider with id: ${deletedProviderID} successfull`)
    return res.status(StatusCodes.OK).json({
      message: 'Delete provider successfull',
    })
  } catch (error: any) {
    logger.error('Delete provider failure: ' + error.loggerMs && error?.message)
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

const getProviders = async (req: Request, res: Response) => {
  try {
    const providers: ProviderDTO[] | undefined =
      await providerService.getProviders()

    logger.info(`Get providers successfull`)
    return res.status(StatusCodes.OK).json({
      message: 'Get providers successfull',
      info: providers,
    })
  } catch (error: any) {
    logger.error('Get providers failure: ' + error?.message)
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: 'Get providers failure',
    })
  }
}
export default { createProvider, updateProvider, deleteProvider, getProviders }
