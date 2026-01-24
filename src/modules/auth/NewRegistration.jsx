import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { TextInput, Button, Divider } from 'react-native-paper'
import { ScaledSheet } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import color from '../../core/utils/color'
import fonts from '../../core/utils/fonts'

export default function CreateAccountOtpScreen() {
  const navigation = useNavigation()
  const route = useRoute()

  const { requestId, identifier } = route.params

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')

  const verifyOtpRequest = async () => {
    if (password !== confirmPassword) {
      console.log('Passwords do not match')
      return
    }

    const res = await fetch('http://192.168.31.38:9100/auth/signup/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: identifier.trim().toLowerCase(),
        otp,
        context: 'registration',
        password,
        role: 'customer',
        requestId,
      }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw data
    }

    return data
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
        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.subHeading}>
          Enter the OTP sent to {identifier}
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
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          outlineColor="#ddd"
          activeOutlineColor={color.primary}
          style={styles.input}
        />

        <TextInput
          mode="outlined"
          label="Confirm Password"
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          outlineColor="#ddd"
          activeOutlineColor={color.primary}
          style={styles.input}
        />

        <TextInput
          mode="outlined"
          label="OTP"
          keyboardType="number-pad"
          value={otp}
          onChangeText={setOtp}
          outlineColor="#ddd"
          activeOutlineColor={color.primary}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={async () => {
            try {
              const response = await verifyOtpRequest()
              console.log('ACCOUNT CREATED', response)

              navigation.navigate('Main')
            } catch (err) {
              console.log(err)
            }
          }}
          style={styles.button}
        >
          Create Account
        </Button>

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
          onPress={() => { }}
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

  cardLogo: {
    height: '34@vs',
    width: '100@s',
    alignSelf: 'center',
    marginBottom: '8@vs',
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
