import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { TextInput, Divider } from 'react-native-paper'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ScaledSheet } from 'react-native-size-matters'
import color from '../../core/utils/color'
import fonts from '../../core/utils/fonts'
import BASE_URL from '../../core/services/api'
import AppButton from '../../core/components/global/gloabloadingcomponent'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function OTPScreen({ setIsLoggedIn }) {
  const navigation = useNavigation()
  const { params } = useRoute()

  const { identifier, requestId } = params
  const [otp, setOtp] = useState('')
  const identifierType = identifier.includes('@') ? 'email' : 'phone'
  const isValidOtp = otp.length === 6


  const verifyOtp = async () => {
    if (!isValidOtp) return

    try {
      const res = await fetch(`${BASE_URL}/auth/login/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          identifierType,
          otp,
          context: 'login',
          requestId,
          role: 'customer',
        }),
      })

      const data = await res.json()
      console.log('OTP verification response:', data);
      const token = data?.data?.user?.accessToken

      if (!token) {
        ToastAndroid.show('Token not received', ToastAndroid.SHORT)
        return
      }

      await AsyncStorage.setItem('userToken', token)
      await AsyncStorage.getItem('userToken').then((value) => console.log('Stored token:', value))

      if (!res.ok) {
        console.log('OTP error:', data)
        return
      }

      setIsLoggedIn(true)
    } catch (err) {
      console.log('Network error')
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.skipText}>Back</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.hero}>
        <Text style={styles.title}>
          Secure Login,{'\n'}Enter Verification Code
        </Text>

        <Image
          source={require('../../core/assets/images/constants/floatingbgssd.png')}
          style={styles.productImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>OTP Verification</Text>
        <Text style={styles.subHeading}>
          We’ve sent a 6 digit code to {identifier}
        </Text>

        <TextInput
          mode="outlined"
          label="Enter OTP"
          keyboardType="number-pad"
          value={otp}
          onChangeText={(text) =>
            setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))
          }
          maxLength={6}
          outlineColor="#ddd"
          activeOutlineColor={color.primary}
          style={styles.input}
        />


        <AppButton
          mode="contained"
          disabled={!isValidOtp}
          onPress={verifyOtp}
          style={styles.button}
        >
          Verify & Continue
        </AppButton>


        <View style={styles.dividerRow}>
          <Divider style={styles.divider} />
          <Text style={styles.or}>Didn’t receive code?</Text>
          <Divider style={styles.divider} />
        </View>

        <TouchableOpacity>
          <Text style={styles.resend}>Resend OTP</Text>
        </TouchableOpacity>
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
    marginTop: '16@vs',
    backgroundColor: '#fff',
  },

  button: {
    borderRadius: '8@ms',
    marginVertical: '18@vs',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '10@vs',
  },

  divider: {
    flex: 1,
  },

  or: {
    marginHorizontal: '8@s',
    fontSize: '12@ms',
    color: '#666',
  },

  resend: {
    textAlign: 'center',
    color: color.primary,
    fontSize: '13@ms',
    fontFamily: fonts.MontMedium,
  },
})
