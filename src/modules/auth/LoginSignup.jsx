import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ToastAndroid,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native'
import { TextInput, Divider } from 'react-native-paper'
import color from '../../core/utils/color'
import { ScaledSheet, scale, verticalScale, moderateScale } from 'react-native-size-matters'
import fonts from '../../core/utils/fonts'
import { useNavigation } from '@react-navigation/native'
import BASE_URL from '../../core/services/api'
import { googleLogin } from '../../core/services/googleAuth'
import AppButton from '../../core/components/global/gloabloadingcomponent'

const { width, height } = Dimensions.get('window')

export default function LoginSignupScreen({ setIsLoggedIn }) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const navigation = useNavigation()

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(60)).current
  const cardAnim = useRef(new Animated.Value(80)).current
  const cardFade = useRef(new Animated.Value(0)).current
  const pulse = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start()

    // Subtle pulsing on the decorative circle
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^[0-9]{10}$/
  const isValidEmail = emailRegex.test(value.trim())
  const isValidPhone = phoneRegex.test(value.trim())
  const isValidInput = isValidEmail || isValidPhone

  const signupEmail = async (identifier) => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    })
    return res.json()
  }

  const loginEmail = async (identifier) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    })
    console.log('Login response:', res)
    return res.json()
  }

  const sendPhoneOtp = async (identifier) => {
    const res = await fetch(`${BASE_URL}/auth/login/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier }),
    })
    return res.json()
  }

  const handleContinue = async () => {
    if (!isValidInput) {
      ToastAndroid.show('Enter valid email or 10 digit phone number', ToastAndroid.SHORT)
      return
    }
    try {
      if (isValidEmail) {
        const result = await signupEmail(value.trim())
        if (result?.errorCode) {
          await loginEmail(value.trim())
          navigation.navigate('OTPRegistered', { identifier: value.trim() })
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
      console.log(err)
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT)
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
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* Decorative background blobs */}
      <Animated.View style={[styles.blobTopRight, { transform: [{ scale: pulse }] }]} />
      <View style={styles.blobBottomLeft} />

      {/* Top Bar */}
      <Animated.View
        style={[
          styles.topBar,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <Image
          source={require('../../core/assets/images/constants/logolight.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Hero */}
      <Animated.View
        style={[
          styles.hero,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >

        <Text style={styles.title}>
          Storage Or RAMs,{'\n'}
          <Text style={styles.titleAccent}>You Name It,  We Get It! </Text>
        </Text>

      </Animated.View>

      {/* Card */}
      <Animated.View
        style={[
          styles.card,
          { opacity: cardFade, transform: [{ translateY: cardAnim }] },
        ]}
      >
        {/* Card top handle */}
        <View style={styles.cardHandle} />

        <Text style={styles.heading}>Welcome Back 👋</Text>
        <Text style={styles.subHeading}>
          Sign in or create an account
        </Text>

        <View style={styles.inputWrapper}>
          <TextInput
            mode="outlined"
            label="Email or Phone Number"
            value={value}
            onChangeText={(text) => {
              const cleaned = text.trim()
              if (/^\d+$/.test(cleaned)) {
                setValue(cleaned.slice(0, 10))
              } else {
                setValue(cleaned)
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            keyboardType={/^\d+$/.test(value) ? 'number-pad' : 'default'}
            outlineColor="#E8ECF4"
            activeOutlineColor={color.primary}
            outlineStyle={{ borderRadius: moderateScale(14) }}
            style={styles.input}
            theme={{
              fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
              colors: { onSurfaceVariant: '#9AA3B2' },
            }}
          />
          {/* Validity indicator */}
          {value.length > 0 && (
            <View style={[styles.validDot, { backgroundColor: isValidInput ? '#22C55E' : '#F87171' }]} />
          )}
        </View>

        <AppButton
          mode="contained"
          disabled={!isValidInput}
          onPress={handleContinue}
          style={[
            styles.button,
            !isValidInput && styles.buttonDisabled,
          ]}
          contentStyle={styles.buttonContent}
        >
          Continue →
        </AppButton>

        {/* Divider
        <View style={styles.dividerRow}>
          <Divider style={styles.divider} />
          <Text style={styles.or}>or continue with</Text>
          <Divider style={styles.divider} />
        </View> */}

        {/* Google Button
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogleLogin}
          activeOpacity={0.75}
        >
          <Image
            source={require('../../core/assets/images/constants/googleimg.png')}
            style={styles.googleIcon}
          />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity> */}

        <Text style={styles.termsText}>
          By continuing, you agree to our{' '}
          <Text style={styles.termsLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.termsLink}>Privacy Policy</Text>
        </Text>
      </Animated.View>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.primary,
    overflow: 'hidden',
  },

  // Decorative blobs
  blobTopRight: {
    position: 'absolute',
    top: '-60@vs',
    right: '-60@s',
    width: '200@s',
    height: '200@s',
    borderRadius: '100@s',
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: '180@vs',
    left: '-80@s',
    width: '180@s',
    height: '180@s',
    borderRadius: '90@s',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },

  // Top bar
  topBar: {
    paddingHorizontal: '20@s',
    paddingTop: '16@vs',
  },
  logo: {
    height: '52@vs',
    width: '110@s',
    marginLeft: '-30@s',
  },

  // Hero section
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '12@s',
    paddingTop: '20@vs',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: '12@s',
    paddingVertical: '5@vs',
    borderRadius: '20@ms',
    marginBottom: '14@vs',
  },
  badgeDot: {
    width: '6@ms',
    height: '6@ms',
    borderRadius: '3@ms',
    backgroundColor: '#4ADE80',
    marginRight: '6@s',
  },
  badgeText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: '11@ms',
    fontFamily: fonts.MontRegular,
    letterSpacing: 0.4,
  },
  title: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '22@ms',
    lineHeight: '32@vs',
    fontFamily: fonts.MontBold,
    textAlign: 'center',
    width: '90%',
  },
  titleAccent: {
    color: '#fff',
    fontSize: '24@ms',
    fontWeight: '800',
    textAlign: 'center',
  },
  productImage: {
    height: '560@vs',
    width: '100%',
    marginTop: '-160@vs',
    opacity: 0.97,
  },

  // Card
  card: {
    backgroundColor: '#FAFBFF',
    borderTopLeftRadius: '32@ms',
    borderTopRightRadius: '32@ms',
    paddingHorizontal: '24@s',
    paddingTop: '10@vs',
    paddingBottom: '24@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 16,
  },
  cardHandle: {
    alignSelf: 'center',
    width: '36@s',
    height: '4@vs',
    borderRadius: '2@ms',
    backgroundColor: '#DDE2EF',
    marginBottom: '18@vs',
  },
  heading: {
    fontSize: '22@ms',
    fontWeight: '800',
    color: '#0F172A',
    fontFamily: fonts.MontBold,
    marginBottom: '4@vs',
  },
  subHeading: {
    color: '#64748B',
    fontSize: '12@ms',
    fontFamily: fonts.MontRegular,
    lineHeight: '18@vs',
    marginBottom: '18@vs',
  },

  // Input
  inputWrapper: {
    position: 'relative',
    marginBottom: '14@vs',
  },
  input: {
    backgroundColor: '#fff',
    fontSize: '14@ms',
    fontFamily: fonts.MontRegular,
  },
  validDot: {
    position: 'absolute',
    right: '14@s',
    top: '50%',
    marginTop: '-5@vs',
    width: '10@ms',
    height: '10@ms',
    borderRadius: '5@ms',
  },

  // Continue button
  button: {
    borderRadius: '14@ms',
    marginBottom: '18@vs',
    backgroundColor: color.primary,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    height: '50@vs',
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '14@vs',
  },
  divider: {
    flex: 1,
    backgroundColor: '#E8ECF4',
    height: 1,
  },
  or: {
    marginHorizontal: '10@s',
    fontSize: '11@ms',
    color: '#94A3B8',
    fontFamily: fonts.MontRegular,
    letterSpacing: 0.3,
  },

  // Google button
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: '14@ms',
    paddingVertical: '13@vs',
    backgroundColor: '#fff',
    marginBottom: '16@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  googleIcon: {
    width: '22@ms',
    height: '22@ms',
    marginRight: '10@s',
  },
  googleText: {
    fontSize: '14@ms',
    fontWeight: '600',
    color: '#1E293B',
    fontFamily: fonts.MontBold,
  },

  // Terms
  termsText: {
    textAlign: 'center',
    fontSize: '10@ms',
    color: '#94A3B8',
    fontFamily: fonts.MontRegular,
    lineHeight: '15@vs',
  },
  termsLink: {
    color: color.primary,
    fontFamily: fonts.MontBold,
  },
})