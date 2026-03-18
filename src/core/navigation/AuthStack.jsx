import { createNativeStackNavigator } from '@react-navigation/native-stack'
import LoginScreen from '../../modules/auth/LoginSignup'
import OTPRegistered from '../../modules/auth/OTPRegistered'
import NewRegistration from '../../modules/auth/NewRegistration'
import PhoneOTP from '../../modules/auth/PhoneOTP'
import ForgotPassword from '../../modules/auth/ForgotPassword'

const Stack = createNativeStackNavigator()

export default function AuthStack({ setIsLoggedIn }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LoginScreen">
        {(props) => <LoginScreen {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Stack.Screen>
      <Stack.Screen name="OTPRegistered">
        {(props) => <OTPRegistered {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Stack.Screen>
      <Stack.Screen name="NewRegistration">
        {(props) => <NewRegistration {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Stack.Screen>
      <Stack.Screen name="PhoneOTP">
        {(props) => <PhoneOTP {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Stack.Screen>
       <Stack.Screen name="ForgotPassword">
        {(props) => <ForgotPassword {...props} setIsLoggedIn={setIsLoggedIn} />}
      </Stack.Screen>
    </Stack.Navigator>
  )
}
