import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useState } from 'react'
import AuthStack from './AuthStack'
import MainStack from './MainStack'
import SplashScreen from '../../modules/SplashScreen'
import { SafeAreaView } from 'react-native-safe-area-context'
const Stack = createNativeStackNavigator()

export default function RootNavigator() {

  const [isLoggedIn, setIsLoggedIn] = useState(null)

  return (
    
    <SafeAreaView style={{flex:1}}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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