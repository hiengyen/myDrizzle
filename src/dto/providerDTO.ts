interface ProviderDTO {
  id: string
  name: string
  createdAt: Date
  updateAt: Date
}

interface ProviderInsertDTO {
  name: string
}

interface ProviderUpdateDTO {
  id: string
  name: string
}

export { ProviderDTO, ProviderInsertDTO, ProviderUpdateDTO }
