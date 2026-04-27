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
import { useNavigation } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import color from '../../core/utils/color'
import fonts from '../../core/utils/fonts'
import BASE_URL from '../../core/services/api'
import AppButton from '../../core/components/global/gloabloadingcomponent'
import { SafeAreaView } from 'react-native-safe-area-context'

/* ─── Main Screen ─── */
export default function ForgotPasswordScreen() {
  const navigation = useNavigation()

  /* ── step 1 state ── */
  const [step, setStep] = useState(1)
  const [identifier, setIdentifier] = useState('')
  const [requestId, setRequestId] = useState(null)
  const [loading, setLoading] = useState(false)

  /* ── step 2 state ── */
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  /* ── animations ── */
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(40)).current
  const cardAnim = useRef(new Animated.Value(40)).current
  const cardFade = useRef(new Animated.Value(0)).current
  const stepFade = useRef(new Animated.Value(1)).current

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

  /* animate card when step changes */
  const advanceStep = () => {
    Animated.sequence([
      Animated.timing(stepFade, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(stepFade, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start()
    setStep(2)
  }

  /* ── validation ── */
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim())
  const isValidOtp = otp.length === 6
  const isStrongPwd = (v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(v)
  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
  const canStep1 = isValidEmail
  const canStep2 = isValidOtp && isStrongPwd(password) && passwordsMatch

  /* ── STEP 1: Initiate forgot password ── */
  const handleInitiate = async () => {
    if (!isValidEmail) {
      ToastAndroid.show('Enter a valid email address', ToastAndroid.SHORT)
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim().toLowerCase() }),
      })
      const data = await res.json()
      console.log('Forgot password initiate:', data)

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
      const res = await fetch(`${BASE_URL}/auth/forgot-password/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim().toLowerCase(),
          otp,
          context: 'forgot_password',
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
        if (code === 'OTP_INVALID') ToastAndroid.show('Invalid or expired OTP. Please try again.', ToastAndroid.LONG)
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
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* Blue Header */}
      <Animated.View
        style={[
          styles.header,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <TouchableOpacity
          onPress={() => step === 2 ? setStep(1) : navigation.goBack()}
          style={styles.backBtn}
        >
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
            {step === 1 ? (
              <>
                <Text style={styles.welcomeText}>Forgot Your</Text>
                <Text style={styles.appNameRow}>
                  <Text style={styles.appNameAccent}>Password?</Text>
                </Text>
                <Text style={styles.subHeading}>
                  Enter your registered email and we'll send you a 6-digit OTP to reset your password.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.welcomeText}>Check Your</Text>
                <Text style={styles.appNameRow}>
                  <Text style={styles.appNameAccent}>Email Inbox!</Text>
                </Text>
                <Text style={styles.subHeading}>
                  OTP sent to{' '}
                  <Text style={styles.identifierHighlight}>{identifier}</Text>
                  {'. '}Enter it below along with your new password.
                </Text>
              </>
            )}
          </Animated.View>

          {/* Form Block */}
          <Animated.View
            style={[
              styles.formBlock,
              { opacity: stepFade },
            ]}
          >
            {/* ════════ STEP 1 ════════ */}
            {step === 1 && (
              <>
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
                    outlineStyle={{ borderRadius: moderateScale(6) }}
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
              </>
            )}

            {/* ════════ STEP 2 ════════ */}
            {step === 2 && (
              <>
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
                    outlineStyle={{ borderRadius: moderateScale(6) }}
                    style={styles.inputOtp}
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
                  {/* OTP progress dots */}
                  <View style={styles.otpDotsRow}>
                    {[0, 1, 2, 3, 4, 5].map(i => (
                      <View key={i} style={[styles.otpDot, i < otp.length && styles.otpDotFilled]} />
                    ))}
                  </View>
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
                    outlineStyle={{ borderRadius: moderateScale(6) }}
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

                {/* Password rules hint */}
                {password.length > 0 && !isStrongPwd(password) && (
                  <View style={styles.rulesBox}>
                    {[
                      { rule: /.{8,}/, label: '8+ characters' },
                      { rule: /[A-Z]/, label: 'Uppercase letter' },
                      { rule: /[a-z]/, label: 'Lowercase letter' },
                      { rule: /\d/, label: 'Number' },
                      { rule: /[^A-Za-z0-9]/, label: 'Special character' },
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
                    outlineStyle={{ borderRadius: moderateScale(6) }}
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

            {/* Terms */}
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Action Button — pinned to bottom */}
        <Animated.View style={[styles.bottomBar, { opacity: cardFade }]}>
          {step === 1 ? (
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
          ) : (
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
          )}
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
    marginBottom: '12@vs',
  },
  input: {
    backgroundColor: '#fff',
    fontSize: '13@ms',
    fontFamily: fonts.MontRegular,
  },
  inputOtp: {
    backgroundColor: '#fff',
    fontSize: '16@ms',
    fontFamily: fonts.MontBold,
    letterSpacing: '4@ms',
  },

  // ── OTP dots ─────────────────────────────────────────────────────────────────
  otpDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: '8@s',
    marginTop: '10@vs',
  },
  otpDot: {
    width: '10@ms',
    height: '10@ms',
    borderRadius: '5@ms',
    backgroundColor: '#E8ECF4',
  },
  otpDotFilled: {
    backgroundColor: color.primary,
    transform: [{ scale: 1.15 }],
  },

  // ── Password rules ────────────────────────────────────────────────────────────
  rulesBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: '8@ms',
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

  // ── Mismatch ─────────────────────────────────────────────────────────────────
  mismatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '5@s',
    marginTop: '-4@vs',
    marginBottom: '8@vs',
    paddingHorizontal: '2@s',
  },
  mismatchText: {
    fontSize: '11@ms',
    color: '#F87171',
    fontFamily: fonts.MontRegular,
  },

  // ── Resend row ────────────────────────────────────────────────────────────────
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

  // ── Terms ─────────────────────────────────────────────────────────────────────
  termsText: {
    textAlign: 'center',
    fontSize: '11@ms',
    color: '#94A3B8',
    fontFamily: fonts.MontRegular,
    lineHeight: '16@vs',
  },
  termsLink: {
    color: color.primary,
    fontFamily: fonts.MontBold,
  },

  // ── Bottom Bar / Action Button ────────────────────────────────────────────────
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