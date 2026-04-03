import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ToastAndroid,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { TextInput, Divider } from 'react-native-paper'
import { ScaledSheet, moderateScale } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import color from '../../core/utils/color'
import fonts from '../../core/utils/fonts'
import BASE_URL from '../../core/services/api'
import AppButton from '../../core/components/global/gloabloadingcomponent'

const { height } = Dimensions.get('window')

export default function PasswordLoginScreen({ setIsLoggedIn }) {
  const navigation = useNavigation()
  const { params } = useRoute()
  const identifier = params?.identifier

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // ── Animations ──────────────────────────────────────────────────────────────
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

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  // ── Validation ──────────────────────────────────────────────────────────────
  const isStrongPassword = (value) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(value)
  const isValid = isStrongPassword(password)

  // ── Login ───────────────────────────────────────────────────────────────────
  const loginRequest = async () => {
    if (!isValid) {
      ToastAndroid.show('Password must be 8+ chars with upper, lower & number', ToastAndroid.SHORT)
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

      if (data?.data?.user?.identifier) {
        await AsyncStorage.setItem(
          'Identifier',
          JSON.stringify(data?.data?.user?.identifier)
        )
      }


      if (!res.ok) {
        ToastAndroid.show(data?.message || 'Login failed', ToastAndroid.SHORT)
        return
      }

      const token = data?.data?.user?.accessToken
      const customerId = data?.data?.user?.id

      if (!token) {
        ToastAndroid.show('Token not received', ToastAndroid.SHORT)
        return
      }

      /* ---------- FETCH PROFILE HERE ---------- */

      if (token) {
        try {

          const profileRes = await fetch(
            `${BASE_URL}/customer/business/ad1351af-4c82-4206-9dee-2db2545acd19/customer-business-profile`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
            }
          )

          const profileJson = await profileRes.json()
          console.log(profileJson, 'Fetched profile during splash')

          if (profileJson?.success && profileJson?.data) {
            await AsyncStorage.setItem(
              'userProfile',
              JSON.stringify(profileJson.data)
            )
          }

        } catch (err) {
          console.log('Profile fetch failed during splash')
        }
      }

      await AsyncStorage.setItem('userToken', token)
      await AsyncStorage.setItem('customerId', customerId)
      await AsyncStorage.getItem('userToken').then((value) => console.log('Stored token:', value))
      setIsLoggedIn(true)
    } catch (err) {
      ToastAndroid.show('Something went wrong', ToastAndroid.SHORT)
    }
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={color.primary} />

        {/* Decorative blobs */}
        <Animated.View style={[styles.blobTopRight, { transform: [{ scale: pulse }] }]} />
        <View style={styles.blobBottomLeft} />

        {/* Top Bar */}
        <Animated.View
          style={[styles.topBar, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Icon name="arrow-left" size={moderateScale(20)} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Hero */}
        <Animated.View
          style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Text style={styles.title}>
            Welcome Back,{'\n'}
            <Text style={styles.titleAccent}>Good To See You! 👋</Text>
          </Text>
        </Animated.View>

        {/* Card */}
        <Animated.View
          style={[styles.card, { opacity: cardFade, transform: [{ translateY: cardAnim }] }]}
        >
          {/* Card handle */}
          <View style={styles.cardHandle} />

          <Text style={styles.heading}>Login to Continue</Text>
          <Text style={styles.subHeading}>
            Signing in as <Text style={styles.identifierHighlight}>{identifier}</Text>
          </Text>

          {/* Email (disabled) */}
          <View style={styles.inputWrapper}>
            <TextInput
              mode="outlined"
              label="Email"
              value={identifier}
              disabled
              outlineColor="#E8ECF4"
              activeOutlineColor={color.primary}
              outlineStyle={{ borderRadius: moderateScale(14) }}
              style={styles.input}
              left={<TextInput.Icon icon={() => <Icon name="email-outline" size={18} color="#9AA3B2" />} />}
              theme={{ fonts: { bodyLarge: { fontFamily: fonts.MontRegular } } }}
            />
            <View style={styles.lockBadge}>
              <Icon name="lock-outline" size={moderateScale(11)} color="#9AA3B2" />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputWrapper}>
            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              outlineColor="#E8ECF4"
              activeOutlineColor={color.primary}
              outlineStyle={{ borderRadius: moderateScale(14) }}
              style={styles.input}
              left={<TextInput.Icon icon={() => <Icon name="lock-outline" size={18} color="#9AA3B2" />} />}
              right={
                <TextInput.Icon
                  icon={() => (
                    <Icon
                      name={
                        password.length === 0
                          ? showPassword ? 'eye-off-outline' : 'eye-outline'
                          : isValid
                            ? 'check-circle'
                            : showPassword ? 'eye-off-outline' : 'eye-outline'
                      }
                      size={18}
                      color={isValid ? '#22C55E' : '#9AA3B2'}
                      onPress={() => setShowPassword(!showPassword)}
                    />
                  )}
                />
              }
              theme={{
                fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
                colors: { onSurfaceVariant: '#9AA3B2' },
              }}
            />
          </View>

          {/* Login Button */}
          <AppButton
            mode="contained"
            disabled={!isValid}
            onPress={loginRequest}
            style={[styles.button, !isValid && styles.buttonDisabled]}
            contentStyle={styles.buttonContent}
          >
            Login →
          </AppButton>

          {/* Forgot password */}
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.forgot}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Divider
          <View style={styles.dividerRow}>
            <Divider style={styles.divider} />
            <Text style={styles.or}>or login with</Text>
            <Divider style={styles.divider} />
          </View> */}

          {/* Google Button
          <TouchableOpacity style={styles.googleBtn} activeOpacity={0.75} onPress={() => {}}>
            <Image
              source={require('../../core/assets/images/constants/googleimg.png')}
              style={styles.googleIcon}
            />
            <Text style={styles.googleText}>Continue with Google</Text>
          </TouchableOpacity> */}

        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.primary,
    overflow: 'hidden',
  },

  // ── Blobs ───────────────────────────────────────────────────────────────────
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

  // ── Top bar ─────────────────────────────────────────────────────────────────
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '20@s',
    paddingTop: '16@vs',
  },
  backBtn: {
    width: '36@s',
    height: '36@s',
    borderRadius: '18@ms',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '12@s',
  },
  title: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: '21@ms',
    lineHeight: '31@vs',
    fontFamily: fonts.MontBold,
    textAlign: 'center',
  },
  titleAccent: {
    color: '#fff',
    fontSize: '23@ms',
    fontWeight: '800',
  },

  // ── Card ────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: '#FAFBFF',
    borderTopLeftRadius: '32@ms',
    borderTopRightRadius: '32@ms',
    paddingHorizontal: '24@s',
    paddingTop: '10@vs',
    paddingBottom: '28@vs',
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
    marginBottom: '16@vs',
  },
  heading: {
    fontSize: '22@ms',
    fontWeight: '800',
    color: color.primary,
    fontFamily: fonts.MontBold,
    marginBottom: '4@vs',
  },
  subHeading: {
    color: '#002456',
    fontSize: '12@ms',
    fontFamily: fonts.MontRegular,
    lineHeight: '18@vs',
    marginBottom: '14@vs',
  },
  identifierHighlight: {
    color: color.primary,
    fontFamily: fonts.MontBold,
  },

  // ── Inputs ──────────────────────────────────────────────────────────────────
  inputWrapper: {
    position: 'relative',
    marginBottom: '10@vs',
  },
  input: {
    backgroundColor: '#fff',
    fontSize: '13@ms',
    fontFamily: fonts.MontRegular,
  },
  lockBadge: {
    position: 'absolute',
    right: '14@s',
    top: '50%',
    marginTop: '-8@vs',
  },

  // ── Button ──────────────────────────────────────────────────────────────────
  button: {
    borderRadius: '14@ms',
    marginTop: '4@vs',
    marginBottom: '12@vs',
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

  // Forgot password
  forgot: {
    textAlign: 'center',
    color: color.primary,
    fontSize: '12@ms',
    fontFamily: fonts.MontBold,
    marginBottom: '16@vs',
  },

  // ── Divider ─────────────────────────────────────────────────────────────────
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

  // ── Google Button ───────────────────────────────────────────────────────────
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: '14@ms',
    paddingVertical: '13@vs',
    backgroundColor: '#fff',
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
    color: color.primary,
    fontFamily: fonts.MontBold,
  },
})