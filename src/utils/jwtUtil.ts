import JWT from 'jsonwebtoken'

/*
 @param 
userInfo
secretSignature
tokenLife
 */
const generateToken = async (
  userInfo: any,
  secretSignature: any,
  tokenLife: any,
) => {
  try {
    return JWT.sign(userInfo, secretSignature, {
      algorithm: 'HS256',
      expiresIn: tokenLife,
    })
  } catch (error) {}
}
//verify secretSignature key
const verifyToken = async (token: any, secretSignature: any) => {
  try {
    return JWT.verify(token, secretSignature)
  } catch (error: any) {
    throw new Error(error)
  }
}

export const JwtUtil = {
  generateToken,
  verifyToken,
}
