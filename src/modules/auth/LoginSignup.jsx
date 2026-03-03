import React, { useState } from 'react'
import { View, Text, TouchableOpacity, Image, ToastAndroid } from 'react-native'
import { TextInput, Button, Divider } from 'react-native-paper'
import color from '../../core/utils/color'
import { ScaledSheet } from 'react-native-size-matters'
import fonts from '../../core/utils/fonts'
import { useNavigation } from '@react-navigation/native'
import BASE_URL from '../../core/services/api'
import { googleLogin } from '../../core/services/googleAuth'
import AppButton from '../../core/components/global/gloabloadingcomponent'

export default function LoginSignupScreen({ setIsLoggedIn }) {
  const [value, setValue] = useState('')
  const navigation = useNavigation()

  const emailRegex =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const phoneRegex =
    /^[0-9]{10}$/

  const isValidEmail = emailRegex.test(value.trim())
  const isValidPhone = phoneRegex.test(value.trim())

  const isValidInput = isValidEmail || isValidPhone



  const signupEmail = async (identifier) => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    })
    console.log(res)

    return res.json()
  }

  const loginEmail = async (identifier) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    })
    console.log(res)

    return res.json()

  }

  const sendPhoneOtp = async (identifier) => {
    const res = await fetch(`${BASE_URL}/auth/login/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    })

    console.log(res)

    return res.json()

  }

  const handleContinue = async () => {
    if (!isValidInput) {
      ToastAndroid.show(
        'Enter valid email or 10 digit phone number',
        ToastAndroid.SHORT
      )
      return
    }

    try {
      if (isValidEmail) {
        const result = await signupEmail(value.trim())

        if (result?.errorCode) {
          await loginEmail(value.trim())
          navigation.navigate('OTPRegistered', {
            identifier: value.trim(),
          })
          return
        }

        navigation.navigate('NewRegistration', {
          requestId: result.requestId,
          identifier: result.identifier,
          identifierType: result.identifierType,
        })
        return
      }

      if (isValidPhone) {
        const result = await sendPhoneOtp(value.trim())

        navigation.navigate('PhoneOTP', {
          requestId: result.data.requestId,
          identifier: value.trim(),
        })
      }
    } catch (err) {
      ToastAndroid.show(
        'Something went wrong',
        ToastAndroid.SHORT
      )
    }
  }


  const handleGoogleLogin = async () => {
    try {
      const data = await googleLogin()
      console.log(data.user)
    } catch (err) {
      console.log(err)
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
        <Text style={styles.heading}>Login Or SignUp</Text>
        <Text style={styles.subHeading}>
          Get started & grab best offers on SSDs and more
        </Text>

        <TextInput
          mode="outlined"
          label="Email Or Phone Number"
          value={value}
          onChangeText={(text) => {
            const cleaned = text.trim()

            if (/^\d+$/.test(cleaned)) {
              setValue(cleaned.slice(0, 10))
            } else {
              setValue(cleaned)
            }
          }}
          keyboardType={
            /^\d+$/.test(value) ? 'number-pad' : 'default'
          }
          outlineColor="#ddd"
          activeOutlineColor={color.primary}
          style={styles.input}
        />

        <AppButton
          mode="contained"
          disabled={!isValidInput}
          onPress={handleContinue}
          style={styles.button}
        >
          Continue
        </AppButton>


        <View style={styles.dividerRow}>
          <Divider style={styles.divider} />
          <Text style={styles.or}>or Login with</Text>
          <Divider style={styles.divider} />
        </View>

        <Button
          mode="outlined"
          icon={() => (
            <Image
              source={require('../../core/assets/images/constants/googleimg.png')}
              style={{ width: 22, height: 22 }}
            />
          )}
          onPress={() => handleGoogleLogin()}
          style={styles.googleBtn}
          textColor="#000"
        >
          Continue with Google
        </Button>
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
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginVertical: '50@vs',
    lineHeight: '28@vs',
  },

  productImage: {
    height: '600@vs',
    width: '100%',
    marginTop: '-185@vs',
  },

  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: '26@ms',
    borderTopRightRadius: '26@ms',
    padding: '20@s',
  },

  cardLogo: {
    height: '34@vs',
    width: '100@s',
    alignSelf: 'center',
    marginBottom: '8@vs',
  },

  heading: {
    fontSize: '20@ms',
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: fonts.MontBold,
  },

  subHeading: {
    textAlign: 'center',
    color: '#666',
    fontSize: '11@ms',
    marginVertical: '8@vs',
    fontFamily: fonts.MontRegular,
  },

  input: {
    marginTop: '10@vs',
    marginBottom: '12@vs',
    backgroundColor: '#fff',
  },

  button: {
    borderRadius: '8@ms',
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
});
