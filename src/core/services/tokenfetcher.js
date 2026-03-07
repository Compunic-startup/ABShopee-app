import messaging from '@react-native-firebase/messaging'

export const getFCMToken = async () => {
  try {
    await messaging().requestPermission()
    const token = await messaging().getToken()
    console.log('FCM permission granted.')
    console.log('FCM TOKEN:', token)

    return token
  } catch (e) {
    console.log('Token error', e)
  }
}