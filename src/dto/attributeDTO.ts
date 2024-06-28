interface AttributeTypeDTO {
  typeID: string
  typeValue: string
}

interface AttributeTypeInsertDTO {
  typeValue: string
}

interface AttributeOptionDTO {
  optionID: string
  optionValue: string
}

interface AttributeOptionInsertDTO {
  optionValue: string
  typeID: string
}

interface AttributeDTO {
  typeID: string
  typeValue: string
  options: AttributeOptionDTO[]
}

export {
  AttributeTypeDTO,
  AttributeTypeInsertDTO,
  AttributeOptionDTO,
  AttributeOptionInsertDTO,
  AttributeDTO,
}
