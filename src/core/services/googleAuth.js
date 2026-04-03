import { GoogleSignin } from '@react-native-google-signin/google-signin'
import { request } from './api'

GoogleSignin.configure({
  webClientId: '1032975978331-o89vahto8qt9fb4cj16tmi4hjafjeer7.apps.googleusercontent.com',
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
