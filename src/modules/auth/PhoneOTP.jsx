import React, { useState } from 'react'
import { View, Text, Image } from 'react-native'
import { TextInput, Button } from 'react-native-paper'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ScaledSheet } from 'react-native-size-matters'
import color from '../../core/utils/color'
import fonts from '../../core/utils/fonts'
import BASE_URL from '../../core/services/api'

export default function OTPScreen() {
  const navigation = useNavigation()
  const { params } = useRoute()

  const { identifier, requestId } = params

  const [otp, setOtp] = useState('')
  const identifierType = identifier.includes('@') ? 'email' : 'phone'

  const verifyOtp = async () => {
    console.log('Verifying request id', requestId)
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

    if (!res.ok) {
      console.log('OTP error:', data)
      return
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    })
  }

  return (
    <View style={styles.container}>
      <Image
        source={require('../../core/assets/images/constants/logolight.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.heading}>Enter OTP</Text>
      <Text style={styles.subHeading}>
        OTP sent to {identifier}
      </Text>

      <TextInput
        mode="outlined"
        label="OTP"
        keyboardType="number-pad"
        value={otp}
        onChangeText={setOtp}
        style={styles.input}
        maxLength={6}
        activeOutlineColor={color.primary}
      />

      <Button
        mode="contained"
        onPress={verifyOtp}
        style={styles.button}
      >
        Verify & Continue
      </Button>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: '24@s',
    justifyContent: 'center',
  },

  logo: {
    height: '60@vs',
    width: '60@s',
    alignSelf: 'center',
    marginBottom: '24@vs',
  },

  heading: {
    fontSize: '20@ms',
    fontFamily: fonts.MontBold,
    textAlign: 'center',
  },

  subHeading: {
    fontSize: '13@ms',
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: '8@vs',
    fontFamily: fonts.MontRegular,
  },

  input: {
    marginTop: '16@vs',
    backgroundColor: '#fff',
  },

  button: {
    marginTop: '20@vs',
    borderRadius: '8@ms',
  },
})
