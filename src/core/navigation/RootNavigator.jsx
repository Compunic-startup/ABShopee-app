import { createNativeStackNavigator } from '@react-navigation/native-stack'
import AuthStack from '../navigation/AuthStack'
import MainTabs from './TabNavigator'

const Stack = createNativeStackNavigator()

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthStack} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  )
}
