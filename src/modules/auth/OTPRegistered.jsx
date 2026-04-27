import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ToastAndroid,
  Animated,
  StatusBar,
  ScrollView,
} from 'react-native'
import { TextInput } from 'react-native-paper'
import { ScaledSheet, moderateScale } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import color from '../../core/utils/color'
import fonts from '../../core/utils/fonts'
import BASE_URL from '../../core/services/api'
import AppButton from '../../core/components/global/gloabloadingcomponent'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function PasswordLoginScreen({ setIsLoggedIn }) {
  const navigation = useNavigation()
  const { params } = useRoute()
  const identifier = params?.identifier

  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // ── Animations ──────────────────────────────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current
  const cardAnim = useRef(new Animated.Value(40)).current
  const cardFade = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.stagger(100, [
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 550, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cardAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
    ]).start()
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
        await AsyncStorage.setItem('Identifier', JSON.stringify(data?.data?.user?.identifier))
      }

      if (!res.ok) {
        ToastAndroid.show(data?.message || 'Login failed', ToastAndroid.SHORT)
        return
      }

      const businessId = 'ad1351af-4c82-4206-9dee-2db2545acd19'
      await AsyncStorage.setItem('businessId', businessId)

      const token = data?.data?.user?.accessToken
      const customerId = data?.data?.user?.id

      if (!token) {
        ToastAndroid.show('Token not received', ToastAndroid.SHORT)
        return
      }

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
            await AsyncStorage.setItem('userProfile', JSON.stringify(profileJson.data))
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
    <View style={{flex:1}}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* Blue Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-left" size={moderateScale(20)} color="#fff" />
        </TouchableOpacity>
        <Image
          source={require('../../core/assets/images/constants/aseb2.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* White Card Body */}
      <View style={styles.card}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Heading Block */}
          <Animated.View
            style={[
              styles.headingBlock,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.welcomeText}>Welcome Back,</Text>
            <Text style={styles.appNameRow}>
              Good to{' '}
              <Text style={styles.appNameAccent}>see you!</Text>
            </Text>
            <Text style={styles.subHeading}>
              Signing in as{' '}
              <Text style={styles.identifierHighlight}>{identifier}</Text>
            </Text>
          </Animated.View>

          {/* Form Block */}
          <Animated.View
            style={[
              styles.formBlock,
              { opacity: cardFade, transform: [{ translateY: cardAnim }] },
            ]}
          >
            {/* Email (disabled) */}
            <View style={styles.inputWrapper}>
              <TextInput
                mode="outlined"
                label="Email"
                value={identifier}
                disabled
                outlineColor="#E8ECF4"
                activeOutlineColor={color.primary}
                outlineStyle={{ borderRadius: moderateScale(6) }}
                style={styles.input}
                left={
                  <TextInput.Icon
                    icon={() => <Icon name="email-outline" size={18} color="#9AA3B2" />}
                  />
                }
                theme={{ fonts: { bodyLarge: { fontFamily: fonts.MontRegular } } }}
              />
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
                outlineStyle={{ borderRadius: moderateScale(6) }}
                style={styles.input}
                left={
                  <TextInput.Icon
                    icon={() => <Icon name="lock-outline" size={18} color="#9AA3B2" />}
                  />
                }
                right={
                  <TextInput.Icon
                    icon={() => (
                      <Icon
                        name={
                          password.length === 0
                            ? showPassword
                              ? 'eye-off-outline'
                              : 'eye-outline'
                            : isValid
                            ? 'check-circle'
                            : showPassword
                            ? 'eye-off-outline'
                            : 'eye-outline'
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

            {/* Forgot password */}
            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotRow}
            >
              <Text style={styles.forgot}>Forgot password?</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        {/* Continue Button — pinned to bottom */}
        <Animated.View style={[styles.bottomBar, { opacity: cardFade }]}>
          <AppButton
            mode="contained"
            disabled={!isValid}
            onPress={loginRequest}
            style={[styles.button, !isValid && styles.buttonDisabled]}
            contentStyle={styles.buttonContent}
          >
            Login →
          </AppButton>
        </Animated.View>
      </View>
    </View>
  )
}

const styles = ScaledSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: color.primary,
  },

  // ── Blue Header ──────────────────────────────────────────────────────────────
  header: {
    backgroundColor: color.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: '18@vs',
    paddingHorizontal: '16@s',
  },
  backBtn: {
    width: '36@s',
    height: '36@s',
    borderRadius: '18@ms',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    height: '60@vs',
    width: '260@s',
     
  },

  // ── White Card ───────────────────────────────────────────────────────────────
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: '18@ms',
    borderTopRightRadius: '18@ms',
    overflow: 'hidden',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: '20@s',
    paddingTop: '28@vs',
    paddingBottom: '16@vs',
  },

  // ── Heading Block ────────────────────────────────────────────────────────────
  headingBlock: {
    marginBottom: '28@vs',
  },
  welcomeText: {
    fontSize: '22@ms',
    fontFamily: fonts.MontBold,
    color: '#1A1A2E',
    marginBottom: '2@vs',
  },
  appNameRow: {
    fontSize: '22@ms',
    fontFamily: fonts.MontBold,
    color: '#1A1A2E',
    marginBottom: '10@vs',
  },
  appNameAccent: {
    color: color.primary,
    fontSize: '22@ms',
    fontFamily: fonts.MontBold,
  },
  subHeading: {
    color: '#9AA3B2',
    fontSize: '13@ms',
    fontFamily: fonts.MontRegular,
    lineHeight: '20@vs',
  },
  identifierHighlight: {
    color: color.primary,
    fontFamily: fonts.MontBold,
  },

  // ── Form Block ───────────────────────────────────────────────────────────────
  formBlock: {
    flex: 1,
  },

  // ── Inputs ───────────────────────────────────────────────────────────────────
  inputWrapper: {
    position: 'relative',
    marginBottom: '14@vs',
  },
  input: {
    backgroundColor: '#fff',
    fontSize: '14@ms',
    fontFamily: fonts.MontRegular,
  },

  // ── Forgot ────────────────────────────────────────────────────────────────────
  forgotRow: {
    alignSelf: 'flex-end',
  },
  forgot: {
    fontSize: '13@ms',
    fontFamily: fonts.MontBold,
    color: color.primary,
  },

  // ── Bottom Bar / Login Button ─────────────────────────────────────────────────
  bottomBar: {
    paddingHorizontal: '20@s',
    paddingBottom: '16@vs',
    paddingTop: '8@vs',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  button: {
    borderRadius: '6@ms',
    backgroundColor: color.primary,
  },
  buttonDisabled: {
    opacity: 0.45,
    elevation: 0,
  },
  buttonContent: {
    height: '52@vs',
  },
})