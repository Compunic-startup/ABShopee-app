import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../../modules/auth/LoginSignup'
import OTPRegistered from '../../modules/auth/OTPRegistered'
import NewRegistration from '../../modules/auth/NewRegistration'
import PhoneOTP from '../../modules/auth/PhoneOTP'

const Stack = createNativeStackNavigator()

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="OTPRegistered" component={OTPRegistered} />
      <Stack.Screen name="NewRegistration" component={NewRegistration} />
      <Stack.Screen name="PhoneOTP" component={PhoneOTP} />
    </Stack.Navigator>
  )
}
