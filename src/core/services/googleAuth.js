import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { request } from './api'

GoogleSignin.configure({
  webClientId: '1032975978331-onh0q1pngbsete8egmfvld5pnibplp0t.apps.googleusercontent.com',
  offlineAccess: true,
})

export const googleLogin = async () => {
  await GoogleSignin.hasPlayServices()
  const userInfo = await GoogleSignin.signIn()
  console.log(userInfo.idToken)
  const idToken = userInfo.idToken

  if (!idToken) {
    throw { message: 'Google idToken not found' }
  }

  const res = await request({
    url: 'https://ab-shoppy.icompunic.com/auth/google',
    method: 'POST',
    body: { idToken },
  })

  return res
}

export const googleLogout = async () => {
  await GoogleSignin.signOut()
}
