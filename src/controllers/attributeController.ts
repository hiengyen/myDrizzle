import { Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import logger from '../utils/logger'
import { ConflictError } from '../errors/ConflictError'
import { BadRequestError } from '../errors/BadRequestError'
import {
  AttributeDTO,
  AttributeOptionDTO,
  AttributeOptionInsertDTO,
  AttributeTypeDTO,
  AttributeTypeInsertDTO,
} from '../dto/attributeDTO'
import attributeService from '../services/attributeService'

const createAttributeOption = async (req: Request, res: Response) => {
  if (!req.body.id || !req.body.value) {
    logger.error(
      'Create attribute option failure: request missing some attrs in body'
    )
    throw new BadRequestError('Request missing some attrs in body')
  }
  const newAttributeOption: AttributeOptionInsertDTO = {
    optionValue: req.body.value,
    typeID: req.body.id,
  }

  const attributeOptionInDB: AttributeOptionDTO[] =
    await attributeService.checkIfOptionExisting(
      newAttributeOption.optionValue,
      newAttributeOption.typeID
    )

  if (attributeOptionInDB.length !== 0) {
    logger.error(
      'Create attribute option failure: attribute option already exist'
    )
    throw new ConflictError('Attribute option already exist')
  }

  await attributeService.insertAttributeOption(newAttributeOption)

  logger.info(
    `Attribute option: ${newAttributeOption.optionValue} has been added successfull`
  )
  res.status(StatusCodes.CREATED).json({
    message: 'Create attribute option success',
  })
}

const updateAttributeOption = async (req: Request, res: Response) => {
  if (!req.body.value || !req.body.id) {
    logger.error(
      'Update attribute option failure: request missing some attrs in body'
    )
    throw new BadRequestError('Request missing some attrs in body')
  }
  const attributeOptionReq: AttributeOptionDTO = {
    optionID: req.params.id,
    optionValue: req.body.value,
  }

  const attributeOptionInDB: AttributeOptionDTO[] =
    await attributeService.checkIfOptionExisting(
      attributeOptionReq.optionValue,
      req.body.id
    )

  if (attributeOptionInDB.length !== 0) {
    logger.error(
      'Update attribute option failure: attribute option already exist'
    )
    throw new ConflictError('Attribute option already exist')
  }

  const updatedAttributeOption: AttributeOptionDTO | undefined =
    await attributeService.updateAttributeOption(attributeOptionReq)

  if (!updatedAttributeOption) {
    logger.error('Update attribute option failure: attribute option not found')
    throw new BadRequestError('Attribute option not found')
  }

  logger.info(
    `Update attribute option with id: ${attributeOptionReq.optionID} successfull`
  )
  res.status(StatusCodes.OK).json({
    message: 'Update attribute option success',
  })
}

const deleteAttributeOption = async (req: Request, res: Response) => {
  const attributeOptionIDInReq: string = req.params.id

  const attributeOptionInDB: AttributeOptionDTO[] | undefined =
    await attributeService.getAttributeOptionByID(attributeOptionIDInReq)

  if (!attributeOptionInDB || attributeOptionInDB.length === 0) {
    logger.error('Delete attribute option failure: attribute option not found')
    throw new BadRequestError('attribute option not found')
  }

  //Must delete all the link between attribute option and product
  await attributeService.deleteProductAttributeWithOptionIDs([
    { id: attributeOptionIDInReq },
  ])

  //Then delete the attribute option
  const deletedAttributeOptionID: string | undefined =
    await attributeService.deleteAttributeOption(attributeOptionIDInReq)

  if (!deletedAttributeOptionID) {
    logger.error('Delete attribute option failure: attribute option not found')
    throw new BadRequestError('attribute option not found')
  }

  logger.info(
    `Delete attribute option with id: ${deletedAttributeOptionID} successfull`
  )
  res.status(StatusCodes.OK).json({
    message: 'Delete attribute option successfull',
  })
}

const createAttributeType = async (req: Request, res: Response) => {
  if (!req.body.value) {
    logger.error(
      'Create attribute type failure: request missing some attrs in body'
    )
    throw new BadRequestError('Request missing some attrs in body')
  }
  const newAttributeType: AttributeTypeInsertDTO = {
    typeValue: req.body.value,
  }

  const attributeTypeInDB: AttributeTypeDTO[] =
    await attributeService.getAttributeTypeByValue(newAttributeType.typeValue)

  if (attributeTypeInDB.length !== 0) {
    logger.error('Create attribute type failure: attribute type already exist')
    throw new ConflictError('Attribute type already exist')
  }

  await attributeService.insertAttributeType(newAttributeType)

  logger.info(
    `Attribute type: ${newAttributeType.typeValue} has been added successfull`
  )
  res.status(StatusCodes.CREATED).json({
    message: 'Create attribute type success',
  })
}

const updateAttributeType = async (req: Request, res: Response) => {
  if (!req.body.value) {
    logger.error(
      'Update attribute type failure: request missing some attrs in body'
    )
    throw new BadRequestError('Request missing some attrs in body')
  }
  const attributeTypeReq: AttributeTypeDTO = {
    typeID: req.params.id,
    typeValue: req.body.value,
  }

  const attributeTypeInDB: AttributeTypeDTO[] =
    await attributeService.getAttributeTypeByValue(attributeTypeReq.typeValue)

  if (attributeTypeInDB.length !== 0) {
    logger.error('Update attribute type failure: attribute type already exist')
    throw new ConflictError('Attribute type already exist')
  }

  const updatedAttributeType: AttributeTypeDTO | undefined =
    await attributeService.updateAttributeType(attributeTypeReq)

  if (!updatedAttributeType) {
    logger.error('Update attribute type failure: attribute type not found')
    throw new BadRequestError('Attribute type not found')
  }

  logger.info(
    `Update attribute type with id: ${attributeTypeReq.typeID} successfull`
  )
  res.status(StatusCodes.OK).json({
    message: 'Update attribute type success',
  })
}

const deleteAttributeType = async (req: Request, res: Response) => {
  const attributeTypeIDInReq: string = req.params.id

  // Check if attribute type exist or not
  const attributeTypeInDB: AttributeTypeDTO[] | undefined =
    await attributeService.getAttributeTypeByID(attributeTypeIDInReq)

  if (!attributeTypeInDB || attributeTypeInDB.length === 0) {
    logger.error('Delete attribute type failure: attribute type not found')
    throw new BadRequestError('attribute type not found')
  }

  //Also need to delete all option belong to that type too
  const deletedOptionIDs: { id: string }[] | undefined =
    await attributeService.deleteAttributeOptionWithTypeID(attributeTypeIDInReq)
  deletedOptionIDs &&
    attributeService.deleteProductAttributeWithOptionIDs(deletedOptionIDs)

  //then delete type
  const deletedAttributeTypeID: string | undefined =
    await attributeService.deleteAttributeType(attributeTypeIDInReq)

  if (!deletedAttributeTypeID) {
    logger.error('Delete attribute type failure: attribute type not found')
    throw new BadRequestError('attribute type not found')
  }

  logger.info(
    `Delete attribute type with id: ${deletedAttributeTypeID} successfull`
  )
  res.status(StatusCodes.OK).json({
    message: 'Delete attribute type successfull',
  })
}

const getAttributes = async (req: Request, res: Response) => {
  const attributes: AttributeDTO[] | undefined =
    await attributeService.getAttributes()

  logger.info(`Get attributes successfull`)
  res.status(StatusCodes.OK).json({
    message: 'Get attributes successfull',
    info: attributes,
  })
}

export default {
  createAttributeType,
  updateAttributeType,
  deleteAttributeType,
  createAttributeOption,
  updateAttributeOption,
  deleteAttributeOption,
  getAttributes,
}
