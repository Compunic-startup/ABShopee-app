import React, { useState } from 'react'
import { View, Text, Image, TouchableOpacity } from 'react-native'
import { TextInput, Button, Divider } from 'react-native-paper'
import { useNavigation, useRoute } from '@react-navigation/native'
import { ScaledSheet } from 'react-native-size-matters'
import color from '../../core/utils/color'
import fonts from '../../core/utils/fonts'

export default function PasswordLoginScreen() {
  const navigation = useNavigation()
  const { params } = useRoute()
  const identifier = params?.identifier

  const [password, setPassword] = useState('')

  const loginRequest = async () => {
    const res = await fetch('http://192.168.31.38:9100/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      console.log(data)
      return
    }

    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    })
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
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          outlineColor="#ddd"
          activeOutlineColor={color.primary}
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={loginRequest}
          style={styles.button}
        >
          Login
        </Button>

        <TouchableOpacity>
          <Text style={styles.forgot}>Forgot password?</Text>
        </TouchableOpacity>

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
          onPress={() => {}}
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
