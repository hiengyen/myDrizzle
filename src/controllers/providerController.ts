import { Request, Response } from 'express'
import { ProviderInsertDTO, ProviderDTO } from '../dto/providerDTO'
import providerService from '../services/providerService'
import { StatusCodes } from 'http-status-codes'
import logger from '../utils/logger'
import { ConflictError } from '../errors/ConflictError'
import { BadRequestError } from '../errors/BadRequestError'

const createProvider = async (req: Request, res: Response) => {
  const newProvider: ProviderInsertDTO = {
    providerName: req.body.name,
  }

  const providerInDB: ProviderDTO[] = await providerService.getProviderByName(
    newProvider.providerName
  )

  if (providerInDB.length !== 0) {
    logger.error('Create provider failure: provider already exist')
    throw new ConflictError('Provider already exist')
  }

  await providerService.insertProvider(newProvider)

  logger.info(`Provider: ${newProvider.providerName} has been added successful`)
  res.status(StatusCodes.CREATED).json({
    message: 'Create provider success',
  })
}

const updateProvider = async (req: Request, res: Response) => {
  const providerReq: ProviderDTO = {
    providerID: req.params.id,
    providerName: req.body.name,
  }

  const providerInDB: ProviderDTO[] = await providerService.getProviderByName(
    providerReq.providerName
  )

  if (providerInDB.length !== 0) {
    logger.error('Update provider failure: provider already exist')
    throw new ConflictError('Provider already exist')
  }

  const updatedProvider: ProviderDTO | undefined =
    await providerService.updateProvider(providerReq)

  if (!updatedProvider) {
    logger.error('Update provider failure: provider not found')
    throw new BadRequestError('Provider not found')
  }

  logger.info(`Update provider with id: ${providerReq.providerID} successfull`)
  res.status(StatusCodes.OK).json({
    message: 'Update provider success',
  })
}

const deleteProvider = async (req: Request, res: Response) => {
  const providerIDInReq: string = req.params.id

  const deletedProviderID: string | undefined =
    await providerService.deleteProvider(providerIDInReq)

  if (!deletedProviderID) {
    logger.error('Delete provider failure: provider not found')
    throw new ConflictError('Provider not found')
  }

  logger.info(`Delete provider with id: ${deletedProviderID} successfull`)
  res.status(StatusCodes.OK).json({
    message: 'Delete provider successfull',
  })
}

const getProviders = async (req: Request, res: Response) => {
  const providers: ProviderDTO[] | undefined =
    await providerService.getProviders()

  logger.info(`Get providers successfull`)
  return res.status(StatusCodes.OK).json({
    message: 'Get providers successfull',
    info: providers,
  })
}

export default { createProvider, updateProvider, deleteProvider, getProviders }
