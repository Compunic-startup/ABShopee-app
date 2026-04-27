import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useState, useEffect } from 'react'
import AuthStack from './AuthStack'
import MainStack from './MainStack'
import SplashScreen from '../../modules/SplashScreen'
import { SafeAreaView } from 'react-native-safe-area-context'
import AsyncStorage from '@react-native-async-storage/async-storage'
const Stack = createNativeStackNavigator()

export default function RootNavigator() {

  const [isLoggedIn, setIsLoggedIn] = useState(null)

  useEffect(() => {
    console.log('isLoggedIn changed to:', isLoggedIn)
  }, [isLoggedIn])

  useEffect(() => {
    const logoutFunction = async () => {
      console.log('Logout function called')
      try {
        await AsyncStorage.removeItem('userToken')
        await AsyncStorage.removeItem('businessId')
        console.log('Storage cleared, setting isLoggedIn to false')
        setIsLoggedIn(false)
      } catch (error) {
        console.log('Logout error:', error)
        setIsLoggedIn(false)
      }
    }

    globalThis.logoutUser = logoutFunction
    console.log('Logout function registered')

    return () => {
      delete globalThis.logoutUser
    }
  }, [])

  return (
    
    <SafeAreaView style={{flex:1}}>
      <Stack.Navigator 
        screenOptions={{ headerShown: false }}
        ref={(navigator) => {
          globalThis.navigationRef = navigator;
        }}
      >
        {isLoggedIn === null ? (
          <Stack.Screen name="SplashScreen">
            {(props) => (
              <SplashScreen {...props} setIsLoggedIn={setIsLoggedIn} />
            )}
          </Stack.Screen>
        ) : isLoggedIn ? (
          <Stack.Screen name="MainStack">
            {(props) => (
              <MainStack {...props} setIsLoggedIn={setIsLoggedIn} />
            )}
          </Stack.Screen>
        ) : (
          <Stack.Screen name="AuthStack">
            {(props) => (
              <AuthStack {...props} setIsLoggedIn={setIsLoggedIn} />
            )}
          </Stack.Screen>
        )}

      </Stack.Navigator>
      
    </SafeAreaView>
  )
}