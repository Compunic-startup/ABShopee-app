import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AuthStack from './AuthStack'
import MainStack from './MainStack'
import { useState } from 'react'

const Stack = createNativeStackNavigator()
export default function RootNavigator() {


  const [isLoggedIn, setIsLoggedIn] = useState(false) 
  
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      {isLoggedIn ? (
        <Stack.Screen name="MainStack" component={MainStack} />
      ) : (
        <Stack.Screen name="AuthStack">
          {(props) => <AuthStack {...props} setIsLoggedIn={setIsLoggedIn} />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  )
}