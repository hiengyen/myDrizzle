import { UserRoles } from './enum'

interface UserResponseDTO {
  id: string
  name: string
  email: string
  phoneNum: string | null
  avatar: string | null
  role: string
  createdAt: Date
  updateAt: Date
}

interface User {
  id: string
  name: string
  email: string
  password: string
  phoneNum: string | null
  avatar: string | null
  role: string
  refreshTokenUsed: string[] | null
  createdAt: Date
  updateAt: Date
}

interface UserUpdateDTO {
  name: string
  email: string
  phoneNum: string | null
  avatar: string | null
}

interface UserInsertDTO {
  name: string
  email: string
  password: string
  role: UserRoles
}

interface UserInTokenPayloadDTO {
  id: string
  role: string
}

interface RefreshTokenUseds {
  refreshTokenUsed: string[] | null
}

export {
  RefreshTokenUseds,
  UserResponseDTO,
  UserUpdateDTO,
  UserInsertDTO,
  UserInTokenPayloadDTO,
  User,
}
