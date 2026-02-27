import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { TextInput, Button, Divider } from 'react-native-paper'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ScaledSheet } from 'react-native-size-matters'
import color from '../../core/utils/color'
import fonts from '../../core/utils/fonts'
import { saveAuthData } from '../../core/storage/authstorage'
import BASE_URL from '../../core/services/api'
import AppButton from '../../core/components/global/gloabloadingcomponent'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { ToastAndroid } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'


export default function PasswordLoginScreen({ setIsLoggedIn }) {
  const navigation = useNavigation()
  const { params } = useRoute()
  const identifier = params?.identifier

  const [password, setPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)

  const isStrongPassword = (value) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
    return regex.test(value)
  }

  const isValid = isStrongPassword(password)


  const loginRequest = async () => {
    if (!isValid) {
      ToastAndroid.show(
        'Password must be 8+ chars with upper, lower & number',
        ToastAndroid.SHORT
      )
      return
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      })

      const data = await res.json()
      console.log(data)

      if (!res.ok) {
        ToastAndroid.show(
          data?.message || 'Login failed',
          ToastAndroid.SHORT
        )
        return
      }

      const token = data?.data?.user?.accessToken

      if (!token) {
        ToastAndroid.show('Token not received', ToastAndroid.SHORT)
        return
      }

      await AsyncStorage.setItem('userToken', token)
      await AsyncStorage.getItem('userToken').then((value) => console.log('Stored token:', value))

      setIsLoggedIn(true)

    } catch (err) {
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Image
          source={require('../../core/assets/images/constants/logolight.png')}
          style={[styles.logo, { marginLeft: -40 }]}
          resizeMode="contain"
        />

        <TouchableOpacity>
          <Text style={styles.skipText}>Skip ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Text style={styles.title}>
          Storage Or RAMs,{'\n'}You Name It, We Get It!
        </Text>

        <Image
          source={require('../../core/assets/images/constants/floatingbgssd.png')}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>Welcome Back</Text>
        <Text style={styles.subHeading}>
          Login to continue with {identifier}
        </Text>

        <TextInput
          mode="outlined"
          label="Email"
          value={identifier}
          disabled
          style={styles.input}
        />

        <TextInput
          mode="outlined"
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          outlineColor="#ddd"
          activeOutlineColor={color.primary}
          style={styles.input}
          right={
            <TextInput.Icon
              icon={() => (
                <Icon
                  name={
                    password.length === 0
                      ? showPassword
                        ? 'eye-off'
                        : 'eye'
                      : isValid
                        ? 'check-circle'
                        : showPassword
                          ? 'eye-off'
                          : 'eye'
                  }
                  size={20}
                  color={isValid ? 'green' : undefined}
                  onPress={() => setShowPassword(!showPassword)}
                />
              )}
            />
          }
        />


        <AppButton
          mode="contained"
          disabled={!isValid}
          onPress={loginRequest}
          style={styles.button}
        >
          Login
        </AppButton>


        <TouchableOpacity>
          <Text style={styles.forgot}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <Divider style={styles.divider} />
          <Text style={styles.or}>or Login with</Text>
          <Divider style={styles.divider} />
        </View>

        <AppButton
          mode="outlined"
          icon={() => (
            <Image
              source={require('../../core/assets/images/constants/googleimg.png')}
              style={{ width: 22, height: 22 }}
            />
          )}
          onPress={() => { }}
          style={styles.googleBtn}
          textColor="#000"
        >
          Continue with Google
        </AppButton>
      </View>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.primary,
  },

  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: '16@s',
    paddingTop: '12@vs',
  },

  logo: {
    height: '40@vs',
    width: '120@s',
  },

  skipText: {
    color: '#fff',
    fontSize: '13@ms',
  },

  hero: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: '20@s',
  },

  title: {
    color: '#fff',
    fontSize: '20@ms',
    fontWeight: '700',
    textAlign: 'center',
    marginVertical: '40@vs',
    fontFamily: fonts.MontBold,
  },

  productImage: {
    height: '450@vs',
    width: '100%',
    marginTop: '-150@vs',
  },

  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: '26@ms',
    borderTopRightRadius: '26@ms',
    padding: '20@s',
  },

  heading: {
    fontSize: '20@ms',
    fontFamily: fonts.MontBold,
    textAlign: 'center',
  },

  subHeading: {
    textAlign: 'center',
    color: '#666',
    fontSize: '11@ms',
    marginVertical: '6@vs',
    fontFamily: fonts.MontRegular,
  },

  input: {
    marginTop: '10@vs',
    backgroundColor: '#fff',
  },

  button: {
    borderRadius: '8@ms',
    marginVertical: '14@vs',
  },

  forgot: {
    textAlign: 'center',
    color: color.primary,
    fontSize: '13@ms',
    fontFamily: fonts.MontMedium,
    marginBottom: '14@vs',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '12@vs',
  },

  divider: {
    flex: 1,
  },

  or: {
    marginHorizontal: '8@s',
    fontSize: '12@ms',
    color: '#666',
  },

  googleBtn: {
    borderRadius: '8@ms',
  },
})
