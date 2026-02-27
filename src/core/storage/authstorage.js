import AsyncStorage from '@react-native-async-storage/async-storage'

const ACCESS_TOKEN_KEY = 'ACCESS_TOKEN'
const REFRESH_TOKEN_KEY = 'REFRESH_TOKEN'
const USER_KEY = 'USER'

export const saveAuthData = async (data) => {
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, data.accessToken],
    [REFRESH_TOKEN_KEY, data.refreshToken],
    [USER_KEY, JSON.stringify({
      id: data.id,
      identifier: data.identifier,
      identifierType: data.identifierType,
      role: data.role,
    })],
  ])
}

export const getAccessToken = async () => {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY)
}

export const clearAuthData = async () => {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_KEY,
  ])
}
