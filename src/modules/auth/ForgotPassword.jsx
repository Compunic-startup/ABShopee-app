import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  ToastAndroid,
  Animated,
  Dimensions,
  StatusBar,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { TextInput } from 'react-native-paper'
import { ScaledSheet, moderateScale } from 'react-native-size-matters'
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import color from '../../core/utils/color'
import fonts from '../../core/utils/fonts'
import BASE_URL from '../../core/services/api'
import AppButton from '../../core/components/global/gloabloadingcomponent'

const { height } = Dimensions.get('window')

/* ─── Password strength helper ─── */
const getStrength = (val) => {
  if (!val) return 0
  let score = 0
  if (val.length >= 8)              score++
  if (/[A-Z]/.test(val))            score++
  if (/[a-z]/.test(val))            score++
  if (/\d/.test(val))               score++
  if (/[^A-Za-z0-9]/.test(val))    score++
  return score // 0–5
}

const STRENGTH_COLOR = ['#E2E8F0', '#F87171', '#FB923C', '#FACC15', '#4ADE80', '#22C55E']
const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent']

/* ─── Strength Bar ─── */
function StrengthBar({ password }) {
  const strength = getStrength(password)
  if (!password) return null
  return (
    <View style={styles.strengthRow}>
      <View style={styles.strengthBarTrack}>
        {[1, 2, 3, 4, 5].map(i => (
          <View
            key={i}
            style={[
              styles.strengthSeg,
              { backgroundColor: i <= strength ? STRENGTH_COLOR[strength] : '#E2E8F0' },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color: STRENGTH_COLOR[strength] }]}>
        {STRENGTH_LABEL[strength]}
      </Text>
    </View>
  )
}

/* ─── Step Indicator ─── */
function StepIndicator({ step }) {
  return (
    <View style={styles.stepsRow}>
      {['Email', 'Reset'].map((label, i) => {
        const idx     = i + 1
        const done    = step > idx
        const active  = step === idx
        return (
          <View key={label} style={styles.stepItem}>
            <View style={[styles.stepDot, (active || done) && styles.stepDotActive]}>
              {done
                ? <Icon name="check" size={moderateScale(11)} color="#fff" />
                : <Text style={styles.stepDotNum}>{idx}</Text>
              }
            </View>
            <Text style={styles.stepLabel}>{label}</Text>
            {i < 1 && (
              <View style={[styles.stepLine, done && styles.stepLineActive]} />
            )}
          </View>
        )
      })}
    </View>
  )
}

/* ─── Main Screen ─── */
export default function ForgotPasswordScreen() {
  const navigation = useNavigation()

  /* ── step 1 state ── */
  const [step,        setStep]        = useState(1)
  const [identifier,  setIdentifier]  = useState('')
  const [requestId,   setRequestId]   = useState(null)
  const [loading,     setLoading]     = useState(false)

  /* ── step 2 state ── */
  const [otp,              setOtp]              = useState('')
  const [password,         setPassword]         = useState('')
  const [confirmPassword,  setConfirmPassword]  = useState('')
  const [showPassword,     setShowPassword]     = useState(false)
  const [showConfirm,      setShowConfirm]      = useState(false)

  /* ── animations ── */
  const fadeAnim  = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(60)).current
  const cardAnim  = useRef(new Animated.Value(80)).current
  const cardFade  = useRef(new Animated.Value(0)).current
  const pulse     = useRef(new Animated.Value(1)).current
  const stepFade  = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
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
        Animated.timing(pulse, { toValue: 1,    duration: 2200, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  /* animate card when step changes */
  const advanceStep = () => {
    Animated.sequence([
      Animated.timing(stepFade, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(stepFade, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start()
    setStep(2)
  }

  /* ── validation ── */
  const isValidEmail   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())
  const isValidOtp     = otp.length === 6
  const isStrongPwd    = (v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(v)
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
  const canStep1       = isValidEmail
  const canStep2       = isValidOtp && isStrongPwd(password) && passwordsMatch

  /* ── STEP 1: Initiate forgot password ── */
  const handleInitiate = async () => {
    if (!isValidEmail) {
      ToastAndroid.show('Enter a valid email address', ToastAndroid.SHORT)
      return
    }
    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ identifier: identifier.trim().toLowerCase() }),
      })
      const data = await res.json()
      console.log('Forgot password initiate:', data)

      /* API returns success even for non-existent users (anti-enumeration) */
      if (data?.success && data?.requestId) {
        setRequestId(data.requestId)
        advanceStep()
        ToastAndroid.show('OTP sent to your email', ToastAndroid.SHORT)
      } else {
        ToastAndroid.show('Something went wrong. Please try again.', ToastAndroid.SHORT)
      }
    } catch (err) {
      console.error('Initiate error:', err)
      ToastAndroid.show('Network error. Please try again.', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
    }
  }

  /* ── STEP 2: Verify OTP & reset password ── */
  const handleReset = async () => {
    if (!isValidOtp) {
      ToastAndroid.show('OTP must be exactly 6 digits', ToastAndroid.SHORT); return
    }
    if (!isStrongPwd(password)) {
      ToastAndroid.show('Password needs upper, lower, number & special char (8+ chars)', ToastAndroid.LONG); return
    }
    if (!passwordsMatch) {
      ToastAndroid.show('Passwords do not match', ToastAndroid.SHORT); return
    }

    setLoading(true)
    try {
      const res  = await fetch(`${BASE_URL}/auth/forgot-password/verify`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          identifier:      identifier.trim().toLowerCase(),
          otp,
          context:         'forgot_password',
          requestId,
          password,
          confirmPassword,
        }),
      })
      const data = await res.json()
      console.log('Forgot password verify:', data)

      if (data?.success) {
        ToastAndroid.show('Password reset successful! Please log in.', ToastAndroid.LONG)
        navigation.navigate('LoginScreen')
      } else {
        const code = data?.error?.code
        if (code === 'OTP_INVALID')        ToastAndroid.show('Invalid or expired OTP. Please try again.', ToastAndroid.LONG)
        else if (code === 'USER_NOT_FOUND') ToastAndroid.show('No account found with this email.', ToastAndroid.SHORT)
        else if (code === 'USER_ACCESS_DENIED') ToastAndroid.show('Your account is blocked. Contact support.', ToastAndroid.LONG)
        else ToastAndroid.show(data?.error?.message || 'Invalid or expired OTP. Please try again.', ToastAndroid.SHORT)
      }
    } catch (err) {
      console.error('Reset error:', err)
      ToastAndroid.show('Network error. Please try again.', ToastAndroid.SHORT)
    } finally {
      setLoading(false)
    }
  }

  /* ── UI ── */
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
          <TouchableOpacity
            onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
            style={styles.backBtn}
          >
            <Icon name="arrow-left" size={moderateScale(20)} color="#fff" />
          </TouchableOpacity>
        </Animated.View>

        {/* Hero */}
        <Animated.View
          style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <Text style={styles.title}>
            {step === 1
              ? <>Forgot Your{'\n'}<Text style={styles.titleAccent}>Password?</Text></>
              : <>Check Your{'\n'}<Text style={styles.titleAccent}>Email Inbox!</Text></>
            }
          </Text>
          {/* <StepIndicator step={step} /> */}
        </Animated.View>

        {/* Card */}
        <Animated.View
          style={[styles.card, { opacity: cardFade, transform: [{ translateY: cardAnim }] }]}
        >
          <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
            style={{ opacity: stepFade }}
          >
            {/* Card handle */}
            <View style={styles.cardHandle} />

            {/* ════════════════ STEP 1 ════════════════ */}
            {step === 1 && (
              <>
                <Text style={styles.heading}>Reset Password,</Text>
                <Text style={styles.subHeading}>
                  Enter your registered email address and we'll send you a 6-digit OTP to reset your password.
                </Text>

                {/* Email */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    mode="outlined"
                    label="Email Address"
                    value={identifier}
                    onChangeText={setIdentifier}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    outlineColor="#E8ECF4"
                    activeOutlineColor={color.primary}
                    outlineStyle={{ borderRadius: moderateScale(14) }}
                    style={styles.input}
                    left={<TextInput.Icon icon={() => <Icon name="email-outline" size={18} color="#9AA3B2" />} />}
                    right={
                      isValidEmail
                        ? <TextInput.Icon icon={() => <Icon name="check-circle" size={18} color="#22C55E" />} />
                        : null
                    }
                    theme={{
                      fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
                      colors: { onSurfaceVariant: '#9AA3B2' },
                    }}
                  />
                </View>

                {/* Info notice */}
                {/* <View style={styles.noticeBox}>
                  <Icon name="information-outline" size={15} color={color.primary} style={{ marginTop: 1 }} />
                  <Text style={styles.noticeText}>
                    For security reasons, we'll send an OTP even if this email isn't registered with us.
                  </Text>
                </View> */}

                <AppButton
                  mode="contained"
                  disabled={!canStep1 || loading}
                  onPress={handleInitiate}
                  style={[styles.button, (!canStep1 || loading) && styles.buttonDisabled]}
                  contentStyle={styles.buttonContent}
                  loading={loading}
                >
                  Send OTP →
                </AppButton>
              </>
            )}

            {/* ════════════════ STEP 2 ════════════════ */}
            {step === 2 && (
              <>
                <Text style={styles.heading}>Set New Password,</Text>
                <Text style={styles.subHeading}>
                  OTP sent to{' '}
                  <Text style={styles.identifierHighlight}>{identifier}</Text>
                  {'. '}Enter it below along with your new password.
                </Text>

                {/* OTP */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    mode="outlined"
                    label="6-digit OTP"
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={(t) => setOtp(t.replace(/[^0-9]/g, '').slice(0, 6))}
                    maxLength={6}
                    outlineColor="#E8ECF4"
                    activeOutlineColor={color.primary}
                    outlineStyle={{ borderRadius: moderateScale(14) }}
                    style={styles.input}
                    left={<TextInput.Icon icon={() => <Icon name="message-outline" size={18} color="#9AA3B2" />} />}
                    right={
                      isValidOtp
                        ? <TextInput.Icon icon={() => <Icon name="check-circle" size={18} color="#22C55E" />} />
                        : null
                    }
                    theme={{
                      fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
                      colors: { onSurfaceVariant: '#9AA3B2' },
                    }}
                  />
                </View>

                {/* OTP progress dots */}
                <View style={styles.otpDotsRow}>
                  {[0,1,2,3,4,5].map(i => (
                    <View key={i} style={[styles.otpDot, i < otp.length && styles.otpDotFilled]} />
                  ))}
                </View>

                {/* New password */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    mode="outlined"
                    label="New Password"
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
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color="#9AA3B2"
                            onPress={() => setShowPassword(p => !p)}
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

                {/* <StrengthBar password={password} /> */}

                {/* Password rules hint */}
                {password.length > 0 && !isStrongPwd(password) && (
                  <View style={styles.rulesBox}>
                    {[
                      { rule: /.{8,}/,          label: '8+ characters'       },
                      { rule: /[A-Z]/,           label: 'Uppercase letter'    },
                      { rule: /[a-z]/,           label: 'Lowercase letter'    },
                      { rule: /\d/,              label: 'Number'              },
                      { rule: /[^A-Za-z0-9]/,   label: 'Special character'   },
                    ].map(({ rule, label }) => {
                      const met = rule.test(password)
                      return (
                        <View key={label} style={styles.ruleRow}>
                          <Icon
                            name={met ? 'check-circle' : 'circle-outline'}
                            size={12}
                            color={met ? '#22C55E' : '#CBD5E1'}
                          />
                          <Text style={[styles.ruleText, met && styles.ruleTextMet]}>{label}</Text>
                        </View>
                      )
                    })}
                  </View>
                )}

                {/* Confirm password */}
                <View style={styles.inputWrapper}>
                  <TextInput
                    mode="outlined"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                    outlineColor="#E8ECF4"
                    activeOutlineColor={color.primary}
                    outlineStyle={{ borderRadius: moderateScale(14) }}
                    style={styles.input}
                    left={<TextInput.Icon icon={() => <Icon name="shield-check-outline" size={18} color="#9AA3B2" />} />}
                    right={
                      confirmPassword.length > 0 && passwordsMatch
                        ? <TextInput.Icon icon={() => <Icon name="check-circle" size={18} color="#22C55E" />} />
                        : (
                          <TextInput.Icon
                            icon={() => (
                              <Icon
                                name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                                size={18}
                                color="#9AA3B2"
                                onPress={() => setShowConfirm(p => !p)}
                              />
                            )}
                          />
                        )
                    }
                    theme={{
                      fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
                      colors: { onSurfaceVariant: '#9AA3B2' },
                    }}
                  />
                </View>

                {/* Mismatch warning */}
                {confirmPassword.length > 0 && !passwordsMatch && (
                  <View style={styles.mismatchRow}>
                    <Icon name="alert-circle-outline" size={13} color="#F87171" />
                    <Text style={styles.mismatchText}>Passwords do not match</Text>
                  </View>
                )}

                <AppButton
                  mode="contained"
                  disabled={!canStep2 || loading}
                  onPress={handleReset}
                  style={[styles.button, (!canStep2 || loading) && styles.buttonDisabled]}
                  contentStyle={styles.buttonContent}
                  loading={loading}
                >
                  Reset Password →
                </AppButton>

                {/* Resend OTP */}
                <TouchableOpacity
                  style={styles.resendRow}
                  onPress={() => { setStep(1); setOtp(''); setPassword(''); setConfirmPassword('') }}
                  activeOpacity={0.7}
                >
                  <Icon name="refresh" size={14} color={color.primary} />
                  <Text style={styles.resendText}>Didn't receive OTP? Change email or resend</Text>
                </TouchableOpacity>
              </>
            )}

            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </Animated.ScrollView>
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

  /* ── Blobs ── */
  blobTopRight: {
    position: 'absolute',
    top: '-60@vs',
    right: '-60@s',
    width: '200@s',
    height: '200@s',
    borderRadius: '100@s',
    backgroundColor: color.secondary,
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

  /* ── Top bar ── */
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: '20@s',
    paddingTop: '16@vs',
    paddingTop: '30@vs',
  },
  backBtn: {
    width: '36@s',
    height: '36@s',
    borderRadius: '18@ms',
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Hero ── */
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: '12@s',
    paddingTop: '10@vs',
    gap: '16@vs',
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

  /* Step indicator */
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: '22@ms',
    height: '22@ms',
    borderRadius: '11@ms',
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#22C55E',
  },
  stepDotNum: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '10@ms',
    fontFamily: fonts.MontBold,
  },
  stepLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '10@ms',
    fontFamily: fonts.MontRegular,
    marginHorizontal: '5@s',
  },
  stepLine: {
    width: '24@s',
    height: '2@vs',
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: '2@s',
  },
  stepLineActive: {
    backgroundColor: '#22C55E',
  },

  /* ── Card ── */
  card: {
    backgroundColor: '#FAFBFF',
    borderTopLeftRadius: '32@ms',
    borderTopRightRadius: '32@ms',
    maxHeight: height * 0.82,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 16,
  },
  scrollContent: {
    paddingHorizontal: '24@s',
    paddingTop: '10@vs',
    paddingBottom: '28@vs',
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
    color: '#64748B',
    fontSize: '12@ms',
    fontFamily: fonts.MontRegular,
    lineHeight: '18@vs',
    marginBottom: '14@vs',
  },
  identifierHighlight: {
    color: color.primary,
    fontFamily: fonts.MontBold,
  },

  /* ── Inputs ── */
  inputWrapper: {
    position: 'relative',
    marginBottom: '5@vs',
  },
  input: {
    backgroundColor: '#fff',
    fontSize: '13@ms',
    fontFamily: fonts.MontRegular,
  },

  /* ── Notice box ── */
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '8@s',
    backgroundColor: '#EFF6FF',
    borderRadius: '10@ms',
    paddingHorizontal: '12@s',
    paddingVertical: '10@vs',
    marginBottom: '14@vs',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  noticeText: {
    flex: 1,
    fontSize: '11@ms',
    color: color.primary,
    fontFamily: fonts.MontRegular,
    lineHeight: '16@vs',
  },

  /* ── Password strength ── */
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '-4@vs',
    marginBottom: '10@vs',
    paddingHorizontal: '4@s',
  },
  strengthBarTrack: {
    flex: 1,
    flexDirection: 'row',
    gap: '4@s',
  },
  strengthSeg: {
    flex: 1,
    height: '4@vs',
    borderRadius: '2@ms',
  },
  strengthLabel: {
    fontSize: '10@ms',
    fontFamily: fonts.MontBold,
    marginLeft: '10@s',
    width: '54@s',
    textAlign: 'right',
  },

  /* Password rules */
  rulesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: '10@ms',
    paddingHorizontal: '12@s',
    paddingVertical: '10@vs',
    marginBottom: '10@vs',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: '5@vs',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
  },
  ruleText: {
    fontSize: '11@ms',
    fontFamily: fonts.MontRegular,
    color: '#94A3B8',
  },
  ruleTextMet: {
    color: '#22C55E',
    fontFamily: fonts.MontBold,
  },

  /* Mismatch */
  mismatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '5@s',
    marginTop: '-2@vs',
    marginBottom: '8@vs',
    paddingHorizontal: '4@s',
  },
  mismatchText: {
    fontSize: '11@ms',
    color: '#F87171',
    fontFamily: fonts.MontRegular,
  },

  /* OTP dots */
  otpDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: '6@s',
    marginTop: '4@vs',
    marginBottom: '10@vs',
  },
  otpDot: {
    width: '8@ms',
    height: '8@ms',
    borderRadius: '4@ms',
    backgroundColor: '#E8ECF4',
  },
  otpDotFilled: {
    backgroundColor: color.primary,
  },

  /* ── Button ── */
  button: {
    borderRadius: '14@ms',
    marginTop: '6@vs',
    marginBottom: '16@vs',
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

  /* Back to login */
  backToLogin: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5@s',
    marginBottom: '16@vs',
  },
  backToLoginText: {
    fontSize: '13@ms',
    color: color.primary,
    fontFamily: fonts.MontBold,
  },

  /* Resend row */
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5@s',
    marginBottom: '16@vs',
  },
  resendText: {
    fontSize: '12@ms',
    color: color.primary,
    fontFamily: fonts.MontBold,
    textAlign: 'center',
  },

  /* Terms */
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