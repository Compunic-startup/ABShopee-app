// import React, { useState, useRef, useEffect } from 'react'
// import {
//   View,
//   Text,
//   Image,
//   TouchableOpacity,
//   ToastAndroid,
//   Animated,
//   Dimensions,
//   StatusBar,
//   ScrollView,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native'
// import { TextInput, Divider } from 'react-native-paper'
// import { ScaledSheet, scale, verticalScale, moderateScale } from 'react-native-size-matters'
// import { useNavigation, useRoute } from '@react-navigation/native'
// import AsyncStorage from '@react-native-async-storage/async-storage'
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
// import color from '../../core/utils/color'
// import fonts from '../../core/utils/fonts'
// import BASE_URL from '../../core/services/api'
// import AppButton from '../../core/components/global/gloabloadingcomponent'

// const { width, height } = Dimensions.get('window')

// export default function CreateAccountOtpScreen({ setIsLoggedIn }) {
//   const navigation = useNavigation()
//   const route = useRoute()
//   const { requestId, identifier } = route.params

//   const [password, setPassword] = useState('')
//   const [confirmPassword, setConfirmPassword] = useState('')
//   const [otp, setOtp] = useState('')
//   const [showPassword, setShowPassword] = useState(false)
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false)

//   // ── Animations (mirrors LoginSignupScreen) ──────────────────────────────────
//   const fadeAnim = useRef(new Animated.Value(0)).current
//   const slideAnim = useRef(new Animated.Value(60)).current
//   const cardAnim = useRef(new Animated.Value(80)).current
//   const cardFade = useRef(new Animated.Value(0)).current
//   const pulse = useRef(new Animated.Value(1)).current

//   useEffect(() => {
//     Animated.stagger(120, [
//       Animated.parallel([
//         Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
//         Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
//       ]),
//       Animated.parallel([
//         Animated.timing(cardFade, { toValue: 1, duration: 500, useNativeDriver: true }),
//         Animated.timing(cardAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
//       ]),
//     ]).start()

//     Animated.loop(
//       Animated.sequence([
//         Animated.timing(pulse, { toValue: 1.08, duration: 2200, useNativeDriver: true }),
//         Animated.timing(pulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
//       ])
//     ).start()
//   }, [])

//   // ── Validation ──────────────────────────────────────────────────────────────
//   const isStrongPassword = (val) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(val)
//   const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
//   const isValidOtp = otp.length === 6
//   const canSubmit = isStrongPassword(password) && passwordsMatch && isValidOtp

//   // ── Password strength bar ───────────────────────────────────────────────────
//   const getStrength = (val) => {
//     if (!val) return 0
//     let score = 0
//     if (val.length >= 8) score++
//     if (/[A-Z]/.test(val)) score++
//     if (/[a-z]/.test(val)) score++
//     if (/\d/.test(val)) score++
//     if (/[^A-Za-z0-9]/.test(val)) score++
//     return score  // 0–5
//   }
//   const strength = getStrength(password)
//   const strengthColor = ['#E2E8F0', '#F87171', '#FB923C', '#FACC15', '#4ADE80', '#22C55E'][strength]
//   const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength]

//   // ── Submit ──────────────────────────────────────────────────────────────────
//   const handleCreateAccount = async () => {
//     if (!isStrongPassword(password)) {
//       ToastAndroid.show('Password must be 8+ chars with upper, lower & number', ToastAndroid.SHORT)
//       return
//     }
//     if (!passwordsMatch) { ToastAndroid.show('Passwords do not match', ToastAndroid.SHORT); return }
//     if (!isValidOtp) { ToastAndroid.show('OTP must be exactly 6 digits', ToastAndroid.SHORT); return }

//     try {
//       const res = await fetch(`${BASE_URL}/auth/signup/verify`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           identifier: identifier.trim().toLowerCase(),
//           otp,
//           context: 'registration',
//           password,
//           role: 'customer',
//           requestId,
//         }),
//       })
//       const data = await res.json()
//       console.log('Signup verify response:', data)

//       if (data?.data?.user?.identifier) {
//         await AsyncStorage.setItem(
//           'Identifier',
//           JSON.stringify(data?.data?.user?.identifier)
//         )
//       }
      
//       const token = data?.data?.user?.accessToken
//       const customerId = data?.data?.user?.id
//       await AsyncStorage.setItem('userToken', token)
//       await AsyncStorage.setItem('customerId', customerId)
//       setIsLoggedIn(true)
//     } catch {
//       ToastAndroid.show('OTP verification failed', ToastAndroid.SHORT)
//     }
//   }

//   // ── UI ──────────────────────────────────────────────────────────────────────
//   return (
//     <KeyboardAvoidingView
//       style={{ flex: 1 }}
//       behavior={Platform.OS === 'ios' ? 'padding' : undefined}
//     >
//       <View style={styles.container}>
//         <StatusBar barStyle="light-content" backgroundColor={color.primary} />

//         {/* Decorative blobs — identical to Login screen */}
//         <Animated.View style={[styles.blobTopRight, { transform: [{ scale: pulse }] }]} />
//         <View style={styles.blobBottomLeft} />

//         {/* Top Bar */}
//         <Animated.View
//           style={[styles.topBar, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
//         >
//           <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
//             <Icon name="arrow-left" size={moderateScale(20)} color="#fff" />
//           </TouchableOpacity>
//         </Animated.View>

//         {/* Hero */}
//         <Animated.View
//           style={[styles.hero, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
//         >
//           <Text style={styles.title}>
//             One Last Step,{'\n'}
//             <Text style={styles.titleAccent}>Let's Set You Up!</Text>
//           </Text>

//         </Animated.View>

//         {/* Card */}
//         <Animated.View
//           style={[styles.card, { opacity: cardFade, transform: [{ translateY: cardAnim }] }]}
//         >
//           <ScrollView
//             showsVerticalScrollIndicator={false}
//             keyboardShouldPersistTaps="handled"
//             contentContainerStyle={styles.scrollContent}
//           >
//             {/* Card handle */}
//             <View style={styles.cardHandle} />

//             <Text style={styles.heading}>Create Your Account ,</Text>
//             <Text style={styles.subHeading}>
//               OTP sent to <Text style={styles.identifierHighlight}>{identifier}</Text>
//             </Text>

//             {/* Email (disabled) */}
//             <View style={styles.inputWrapper}>
//               <TextInput
//                 mode="outlined"
//                 label="Email"
//                 value={identifier}
//                 disabled
//                 outlineColor="#E8ECF4"
//                 activeOutlineColor={color.primary}
//                 outlineStyle={{ borderRadius: moderateScale(14) }}
//                 style={styles.input}
//                 left={<TextInput.Icon icon={() => <Icon name="email-outline" size={18} color="#9AA3B2" />} />}
//                 theme={{ fonts: { bodyLarge: { fontFamily: fonts.MontRegular } } }}
//               />
//               <View style={[styles.lockBadge]}>
//                 <Icon name="lock-outline" size={moderateScale(11)} color="#9AA3B2" />
//               </View>
//             </View>

//             {/* Password */}
//             <View style={styles.inputWrapper}>
//               <TextInput
//                 mode="outlined"
//                 label="Password"
//                 value={password}
//                 onChangeText={setPassword}
//                 secureTextEntry={!showPassword}
//                 outlineColor="#E8ECF4"
//                 activeOutlineColor={color.primary}
//                 outlineStyle={{ borderRadius: moderateScale(14) }}
//                 style={styles.input}
//                 left={<TextInput.Icon icon={() => <Icon name="lock-outline" size={18} color="#9AA3B2" />} />}
//                 right={
//                   <TextInput.Icon
//                     icon={() => (
//                       <Icon
//                         name={showPassword ? 'eye-off-outline' : 'eye-outline'}
//                         size={18}
//                         color="#9AA3B2"
//                         onPress={() => setShowPassword(!showPassword)}
//                       />
//                     )}
//                   />
//                 }
//                 theme={{
//                   fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
//                   colors: { onSurfaceVariant: '#9AA3B2' },
//                 }}
//               />
//             </View>

//             {/* Confirm Password */}
//             <View style={styles.inputWrapper}>
//               <TextInput
//                 mode="outlined"
//                 label="Confirm Password"
//                 value={confirmPassword}
//                 onChangeText={setConfirmPassword}
//                 secureTextEntry={!showConfirmPassword}
//                 outlineColor="#E8ECF4"
//                 activeOutlineColor={color.primary}
//                 outlineStyle={{ borderRadius: moderateScale(14) }}
//                 style={styles.input}
//                 left={<TextInput.Icon icon={() => <Icon name="shield-check-outline" size={18} color="#9AA3B2" />} />}
//                 right={
//                   passwordsMatch ? (
//                     <TextInput.Icon
//                       icon={() => <Icon name="check-circle" size={18} color="#22C55E" />}
//                     />
//                   ) : (
//                     <TextInput.Icon
//                       icon={() => (
//                         <Icon
//                           name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
//                           size={18}
//                           color="#9AA3B2"
//                           onPress={() => setShowConfirmPassword(!showConfirmPassword)}
//                         />
//                       )}
//                     />
//                   )
//                 }
//                 theme={{
//                   fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
//                   colors: { onSurfaceVariant: '#9AA3B2' },
//                 }}
//               />
//             </View>

//             {/* OTP */}
//             <View style={styles.inputWrapper}>
//               <TextInput
//                 mode="outlined"
//                 label="6-digit OTP"
//                 keyboardType="number-pad"
//                 value={otp}
//                 onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
//                 maxLength={6}
//                 outlineColor="#E8ECF4"
//                 activeOutlineColor={color.primary}
//                 outlineStyle={{ borderRadius: moderateScale(14) }}
//                 style={styles.input}
//                 left={<TextInput.Icon icon={() => <Icon name="message-outline" size={18} color="#9AA3B2" />} />}
//                 theme={{
//                   fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
//                   colors: { onSurfaceVariant: '#9AA3B2' },
//                 }}
//               />
//             </View>

//             {/* CTA Button */}
//             <AppButton
//               mode="contained"
//               disabled={!canSubmit}
//               onPress={handleCreateAccount}
//               style={[styles.button, !canSubmit && styles.buttonDisabled]}
//               contentStyle={styles.buttonContent}
//             >
//               Create Account →
//             </AppButton>

//             {/* Divider
//             <View style={styles.dividerRow}>
//               <Divider style={styles.divider} />
//               <Text style={styles.or}>or sign up with</Text>
//               <Divider style={styles.divider} />
//             </View> */}

//             {/* Google Button
//             <TouchableOpacity style={styles.googleBtn} activeOpacity={0.75} onPress={() => {}}>
//               <Image
//                 source={require('../../core/assets/images/constants/googleimg.png')}
//                 style={styles.googleIcon}
//               />
//               <Text style={styles.googleText}>Continue with Google</Text>
//             </TouchableOpacity> */}

//             <Text style={styles.termsText}>
//               By continuing, you agree to our{' '}
//               <Text style={styles.termsLink}>Terms of Service</Text>
//               {' '}and{' '}
//               <Text style={styles.termsLink}>Privacy Policy</Text>
//             </Text>
//           </ScrollView>
//         </Animated.View>
//       </View>
//     </KeyboardAvoidingView>
//   )
// }

// const styles = ScaledSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: color.primary,
//     overflow: 'hidden',
//   },

//   // ── Blobs ───────────────────────────────────────────────────────────────────
//   blobTopRight: {
//     position: 'absolute',
//     top: '-60@vs',
//     right: '-60@s',
//     width: '200@s',
//     height: '200@s',
//     borderRadius: '100@s',
//     backgroundColor: color.secondary,
//   },
//   blobBottomLeft: {
//     position: 'absolute',
//     bottom: '180@vs',
//     left: '-80@s',
//     width: '180@s',
//     height: '180@s',
//     borderRadius: '90@s',
//     backgroundColor: color.secondary,
//   },

//   // ── Top bar ─────────────────────────────────────────────────────────────────
//   topBar: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'flex-start',
//     paddingHorizontal: '20@s',
//     paddingTop: '16@vs',
//     gap: '8@s',
//   },
//   backBtn: {
//     width: '36@s',
//     height: '36@s',
//     borderRadius: '18@ms',
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   logo: {
//     height: '52@vs',
//     width: '110@s',
//     marginLeft: '50@s',
//   },

//   // ── Hero ────────────────────────────────────────────────────────────────────
//   hero: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: '12@s',
//     paddingTop: '10@vs',
//   },
//   title: {
//     color: 'rgba(255,255,255,0.85)',
//     fontSize: '21@ms',
//     lineHeight: '31@vs',
//     fontFamily: fonts.MontBold,
//     textAlign: 'center',
//     marginBottom: '20@vs',
//   },
//   titleAccent: {
//     color: '#fff',
//     fontSize: '23@ms',
//     fontWeight: '800',
//   },

//   // Step indicator
//   stepsRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   stepItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   stepDot: {
//     width: '22@ms',
//     height: '22@ms',
//     borderRadius: '11@ms',
//     backgroundColor: 'rgba(255,255,255,0.25)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   stepDotActive: {
//     backgroundColor: '#22C55E',
//   },
//   stepDotNum: {
//     color: 'rgba(255,255,255,0.7)',
//     fontSize: '10@ms',
//     fontFamily: fonts.MontBold,
//   },
//   stepLabel: {
//     color: 'rgba(255,255,255,0.8)',
//     fontSize: '10@ms',
//     fontFamily: fonts.MontRegular,
//     marginHorizontal: '5@s',
//   },
//   stepLine: {
//     width: '24@s',
//     height: '2@vs',
//     backgroundColor: 'rgba(255,255,255,0.2)',
//     marginHorizontal: '2@s',
//   },
//   stepLineActive: {
//     backgroundColor: '#22C55E',
//   },

//   // ──Card ────────────────────
//   card: {
//     backgroundColor: '#FAFBFF',
//     borderTopLeftRadius: '32@ms',
//     borderTopRightRadius: '32@ms',
//     maxHeight: height * 0.80,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -6 },
//     shadowOpacity: 0.08,
//     shadowRadius: 20,
//     elevation: 16,
//   },
//   scrollContent: {
//     paddingHorizontal: '24@s',
//     paddingTop: '10@vs',
//     paddingBottom: '28@vs',
//   },
//   cardHandle: {
//     alignSelf: 'center',
//     width: '36@s',
//     height: '4@vs',
//     borderRadius: '2@ms',
//     backgroundColor: '#DDE2EF',
//     marginBottom: '16@vs',
//   },
//   heading: {
//     fontSize: '22@ms',
//     fontWeight: '800',
//     color: color.primary,
//     fontFamily: fonts.MontBold,
//     marginBottom: '4@vs',
//   },
//   subHeading: {
//     color: '#64748B',
//     fontSize: '12@ms',
//     fontFamily: fonts.MontRegular,
//     lineHeight: '18@vs',
//     marginBottom: '14@vs',
//   },
//   identifierHighlight: {
//     color: color.primary,
//     fontFamily: fonts.MontBold,
//   },

//   // ── Inputs ──────────────────────────────────────────────────────────────────
//   inputWrapper: {
//     position: 'relative',
//     marginBottom: '5@vs',
//   },
//   input: {
//     backgroundColor: '#fff',
//     fontSize: '13@ms',
//     fontFamily: fonts.MontRegular,
//   },
//   lockBadge: {
//     position: 'absolute',
//     right: '14@s',
//     top: '50%',
//     marginTop: '-8@vs',
//   },

//   // Password strength
//   strengthRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: '-4@vs',
//     marginBottom: '10@vs',
//     paddingHorizontal: '4@s',
//   },
//   strengthBarTrack: {
//     flex: 1,
//     flexDirection: 'row',
//     gap: '4@s',
//   },
//   strengthSeg: {
//     flex: 1,
//     height: '4@vs',
//     borderRadius: '2@ms',
//   },
//   strengthLabel: {
//     fontSize: '10@ms',
//     fontFamily: fonts.MontBold,
//     marginLeft: '10@s',
//     width: '54@s',
//     textAlign: 'right',
//   },

//   // OTP dots
//   otpDotsRow: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: '6@s',
//     marginTop: '6@vs',
//   },
//   otpDot: {
//     width: '8@ms',
//     height: '8@ms',
//     borderRadius: '4@ms',
//     backgroundColor: '#E8ECF4',
//   },
//   otpDotFilled: {
//     backgroundColor: color.primary,
//   },

//   // ── Button ──────────────────────────────────────────────────────────────────
//   button: {
//     borderRadius: '14@ms',
//     marginTop: '6@vs',
//     marginBottom: '16@vs',
//     backgroundColor: color.primary,
//     shadowColor: color.primary,
//     shadowOffset: { width: 0, height: 6 },
//     shadowOpacity: 0.35,
//     shadowRadius: 12,
//     elevation: 8,
//   },
//   buttonDisabled: {
//     opacity: 0.45,
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   buttonContent: {
//     height: '50@vs',
//   },

//   // ── Divider ─────────────────────────────────────────────────────────────────
//   dividerRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: '14@vs',
//   },
//   divider: {
//     flex: 1,
//     backgroundColor: '#E8ECF4',
//     height: 1,
//   },
//   or: {
//     marginHorizontal: '10@s',
//     fontSize: '11@ms',
//     color: '#94A3B8',
//     fontFamily: fonts.MontRegular,
//     letterSpacing: 0.3,
//   },

//   // ── Google Button ───────────────────────────────────────────────────────────
//   googleBtn: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     borderWidth: 1.5,
//     borderColor: '#E2E8F0',
//     borderRadius: '14@ms',
//     paddingVertical: '13@vs',
//     backgroundColor: '#fff',
//     marginBottom: '16@vs',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.04,
//     shadowRadius: 6,
//     elevation: 2,
//   },
//   googleIcon: {
//     width: '22@ms',
//     height: '22@ms',
//     marginRight: '10@s',
//   },
//   googleText: {
//     fontSize: '14@ms',
//     fontWeight: '600',
//     color: '#1E293B',
//     fontFamily: fonts.MontBold,
//   },

//   // ── Terms ───────────────────────────────────────────────────────────────────
//   termsText: {
//     textAlign: 'center',
//     fontSize: '10@ms',
//     color: '#94A3B8',
//     fontFamily: fonts.MontRegular,
//     lineHeight: '15@vs',
//   },
//   termsLink: {
//     color: color.primary,
//     fontFamily: fonts.MontBold,
//   },
// })


import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ToastAndroid,
  Animated,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
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
import { Linking } from 'react-native'

export default function NewRegistrationScreen({ setIsLoggedIn }) {
  const navigation = useNavigation()
  const route = useRoute()
  const { requestId, identifier, identifierType } = route.params

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

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
  const isStrongPassword = (val) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(val)
  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword
  const isValidOtp = otp.length === 6

  const canSubmit =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    isStrongPassword(password) &&
    passwordsMatch &&
    isValidOtp &&
    agreedToTerms

  // ── Password strength ───────────────────────────────────────────────────────
  const getStrength = (val) => {
    if (!val) return 0
    let score = 0
    if (val.length >= 8) score++
    if (/[A-Z]/.test(val)) score++
    if (/[a-z]/.test(val)) score++
    if (/\d/.test(val)) score++
    if (/[^A-Za-z0-9]/.test(val)) score++
    return score
  }
  const strength = getStrength(password)
  const strengthColor = ['#E2E8F0', '#F87171', '#FB923C', '#FACC15', '#4ADE80', '#22C55E'][strength]
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'][strength]

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      ToastAndroid.show('Please enter your full name', ToastAndroid.SHORT)
      return
    }
    if (!isStrongPassword(password)) {
      ToastAndroid.show('Password must be 8+ chars with upper, lower & number', ToastAndroid.SHORT)
      return
    }
    if (!passwordsMatch) {
      ToastAndroid.show('Passwords do not match', ToastAndroid.SHORT)
      return
    }
    if (!isValidOtp) {
      ToastAndroid.show('OTP must be exactly 6 digits', ToastAndroid.SHORT)
      return
    }
    if (!agreedToTerms) {
      ToastAndroid.show('Please agree to the Terms & Privacy Policy', ToastAndroid.SHORT)
      return
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/signup/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim().toLowerCase(),
          otp,
          context: 'registration',
          password,
          role: 'customer',
          requestId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      })
      const data = await res.json()
      console.log('Signup verify response:', data)

      if (data?.data?.user?.identifier) {
        await AsyncStorage.setItem(
          'Identifier',
          JSON.stringify(data?.data?.user?.identifier)
        )
      }

      const token = data?.data?.user?.accessToken
      const customerId = data?.data?.user?.id

      if (!token) {
        ToastAndroid.show('Registration failed. Try again.', ToastAndroid.SHORT)
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
          if (profileJson?.success && profileJson?.data) {
            await AsyncStorage.setItem('userProfile', JSON.stringify(profileJson.data))
          }
        } catch (err) {
          console.log('Profile fetch failed during registration')
        }
      }

      await AsyncStorage.setItem('userToken', token)
      await AsyncStorage.setItem('customerId', customerId)
      setIsLoggedIn(true)
    } catch {
      ToastAndroid.show('Registration failed. Try again.', ToastAndroid.SHORT)
    }
  }

  // ── UI ──────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Back Button */}
        <Animated.View
          style={[
            styles.topBar,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Icon name="arrow-left" size={moderateScale(20)} color={color.primary} />
          </TouchableOpacity>
        </Animated.View>

        {/* Heading Block */}
        <Animated.View
          style={[
            styles.headingBlock,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <Image
            source={require('../../core/assets/images/constants/logodark.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.welcomeText}>Register Account</Text>
          <Text style={styles.appNameRow}>
            to{' '}
            <Text style={styles.appNameAccent}>Your App</Text>
          </Text>
          <Text style={styles.subHeading}>Hello there, register to continue</Text>
        </Animated.View>

        {/* Form Block */}
        <Animated.View
          style={[
            styles.formBlock,
            { opacity: cardFade, transform: [{ translateY: cardAnim }] },
          ]}
        >
          {/* First Name */}
          <View style={styles.inputWrapper}>
            <TextInput
              mode="outlined"
              label="First Name"
              value={firstName}
              onChangeText={setFirstName}
              outlineColor="#E8ECF4"
              activeOutlineColor={color.primary}
              outlineStyle={{ borderRadius: moderateScale(14) }}
              style={styles.input}
              left={
                <TextInput.Icon
                  icon={() => <Icon name="account-outline" size={18} color="#9AA3B2" />}
                />
              }
              right={
                firstName.trim().length > 0 ? (
                  <TextInput.Icon
                    icon={() => <Icon name="check-circle" size={18} color="#22C55E" />}
                  />
                ) : null
              }
              theme={{
                fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
                colors: { onSurfaceVariant: '#9AA3B2' },
              }}
            />
          </View>

          {/* Last Name */}
          <View style={styles.inputWrapper}>
            <TextInput
              mode="outlined"
              label="Last Name"
              value={lastName}
              onChangeText={setLastName}
              outlineColor="#E8ECF4"
              activeOutlineColor={color.primary}
              outlineStyle={{ borderRadius: moderateScale(14) }}
              style={styles.input}
              left={
                <TextInput.Icon
                  icon={() => <Icon name="account-outline" size={18} color="#9AA3B2" />}
                />
              }
              right={
                lastName.trim().length > 0 ? (
                  <TextInput.Icon
                    icon={() => <Icon name="check-circle" size={18} color="#22C55E" />}
                  />
                ) : null
              }
              theme={{
                fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
                colors: { onSurfaceVariant: '#9AA3B2' },
              }}
            />
          </View>

          {/* Email — disabled / pre-filled */}
          <View style={styles.inputWrapper}>
            <TextInput
              mode="outlined"
              label="Email Address"
              value={identifier}
              disabled
              outlineColor="#E8ECF4"
              activeOutlineColor={color.primary}
              outlineStyle={{ borderRadius: moderateScale(14) }}
              style={styles.input}
              left={
                <TextInput.Icon
                  icon={() => <Icon name="email-outline" size={18} color="#9AA3B2" />}
                />
              }
              right={
                <TextInput.Icon
                  icon={() => <Icon name="lock-outline" size={16} color="#C4CEDE" />}
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
              outlineStyle={{ borderRadius: moderateScale(14) }}
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
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#9AA3B2"
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

          {/* Password strength bar */}
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBarTrack}>
                {[1, 2, 3, 4, 5].map((seg) => (
                  <View
                    key={seg}
                    style={[
                      styles.strengthSeg,
                      { backgroundColor: seg <= strength ? strengthColor : '#E8ECF4' },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                {strengthLabel}
              </Text>
            </View>
          )}

          {/* Confirm Password */}
          <View style={styles.inputWrapper}>
            <TextInput
              mode="outlined"
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              outlineColor="#E8ECF4"
              activeOutlineColor={color.primary}
              outlineStyle={{ borderRadius: moderateScale(14) }}
              style={styles.input}
              left={
                <TextInput.Icon
                  icon={() => <Icon name="shield-check-outline" size={18} color="#9AA3B2" />}
                />
              }
              right={
                passwordsMatch ? (
                  <TextInput.Icon
                    icon={() => <Icon name="check-circle" size={18} color="#22C55E" />}
                  />
                ) : (
                  <TextInput.Icon
                    icon={() => (
                      <Icon
                        name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#9AA3B2"
                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
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

          {/* OTP */}
          <View style={styles.inputWrapper}>
            <TextInput
              mode="outlined"
              label="6-digit OTP"
              keyboardType="number-pad"
              value={otp}
              onChangeText={(text) =>
                setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))
              }
              maxLength={6}
              outlineColor="#E8ECF4"
              activeOutlineColor={color.primary}
              outlineStyle={{ borderRadius: moderateScale(14) }}
              style={styles.input}
              left={
                <TextInput.Icon
                  icon={() => <Icon name="message-outline" size={18} color="#9AA3B2" />}
                />
              }
              right={
                isValidOtp ? (
                  <TextInput.Icon
                    icon={() => <Icon name="check-circle" size={18} color="#22C55E" />}
                  />
                ) : null
              }
              theme={{
                fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
                colors: { onSurfaceVariant: '#9AA3B2' },
              }}
            />
            <View style={styles.otpDotsRow}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[styles.otpDot, i < otp.length && styles.otpDotFilled]}
                />
              ))}
            </View>
          </View>

          {/* Terms Checkbox */}
          <TouchableOpacity
            style={styles.termsRow}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, agreedToTerms && styles.checkboxActive]}>
              {agreedToTerms && (
                <Icon name="check" size={moderateScale(12)} color="#fff" />
              )}
            </View>
            <Text style={styles.termsRowText}>
              I agree to the{' '}
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://abshopee.com/terms')}
              >
                Terms & Conditions
              </Text>
              {' '}&{' '}
              <Text
                style={styles.termsLink}
                onPress={() => Linking.openURL('https://abshopee.com/privacy-policy')}
              >
                Privacy Policy
              </Text>
              {' '}set out by this site.
            </Text>
          </TouchableOpacity>

          {/* Register Button */}
          <AppButton
            mode="contained"
            disabled={!canSubmit}
            onPress={handleRegister}
            style={[styles.button, !canSubmit && styles.buttonDisabled]}
            contentStyle={styles.buttonContent}
          >
            Register
          </AppButton>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.orText}>Or continue with social account</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Button */}
          <TouchableOpacity
            style={styles.googleBtn}
            activeOpacity={0.75}
            onPress={() => {}}
          >
            <Image
              source={require('../../core/assets/images/constants/googleimg.png')}
              style={styles.googleIcon}
            />
            <Text style={styles.googleText}>Google</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: cardFade }]}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate('Login')}
            >
              Login
            </Text>
          </Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: '24@s',
    paddingTop: '16@vs',
    paddingBottom: '32@vs',
  },

  // ── Top Bar ─────────────────────────────────────────────────────────────────
  topBar: {
    marginBottom: '20@vs',
    marginTop: '8@vs',
    paddingTop: '30@vs',
  },
  backBtn: {
    width: '40@s',
    height: '40@s',
    borderRadius: '12@ms',
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Heading Block ────────────────────────────────────────────────────────────
  headingBlock: {
    marginBottom: '24@vs',
  },
  logo: {
    height: '48@vs',
    width: '48@s',
    marginBottom: '16@vs',
  },
  welcomeText: {
    fontSize: '26@ms',
    fontFamily: fonts.MontBold,
    color: '#1A1A2E',
    marginBottom: '2@vs',
  },
  appNameRow: {
    fontSize: '26@ms',
    fontFamily: fonts.MontBold,
    color: '#1A1A2E',
    marginBottom: '8@vs',
  },
  appNameAccent: {
    color: color.primary,
    fontSize: '26@ms',
    fontFamily: fonts.MontBold,
  },
  subHeading: {
    color: '#9AA3B2',
    fontSize: '13@ms',
    fontFamily: fonts.MontRegular,
    lineHeight: '20@vs',
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

  // ── Password strength ────────────────────────────────────────────────────────
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '-4@vs',
    marginBottom: '10@vs',
    paddingHorizontal: '2@s',
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

  // ── Terms checkbox ────────────────────────────────────────────────────────────
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: '20@vs',
    gap: '10@s',
  },
  checkbox: {
    width: '20@ms',
    height: '20@ms',
    borderRadius: '6@ms',
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '1@vs',
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: color.primary,
    borderColor: color.primary,
  },
  termsRowText: {
    flex: 1,
    fontSize: '12@ms',
    color: '#64748B',
    fontFamily: fonts.MontRegular,
    lineHeight: '18@vs',
  },
  termsLink: {
    color: color.primary,
    fontFamily: fonts.MontBold,
  },

  // ── Button ───────────────────────────────────────────────────────────────────
  button: {
    borderRadius: '14@ms',
    marginBottom: '24@vs',
    backgroundColor: color.primary,
    shadowColor: color.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonDisabled: {
    opacity: 0.45,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    height: '52@vs',
  },

  // ── Divider ──────────────────────────────────────────────────────────────────
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '20@vs',
    gap: '10@s',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E8ECF4',
  },
  orText: {
    fontSize: '11@ms',
    color: '#9AA3B2',
    fontFamily: fonts.MontRegular,
    textAlign: 'center',
  },

  // ── Google Button ─────────────────────────────────────────────────────────────
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: '14@ms',
    paddingVertical: '14@vs',
    backgroundColor: '#fff',
    marginBottom: '24@vs',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    gap: '10@s',
  },
  googleIcon: {
    width: '22@ms',
    height: '22@ms',
  },
  googleText: {
    fontSize: '14@ms',
    fontFamily: fonts.MontBold,
    color: '#1E293B',
  },
  
  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '8@vs',
  },
  footerText: {
    textAlign: 'center',
    fontSize: '12@ms',
    color: '#94A3B8',
    fontFamily: fonts.MontRegular,
  },
  footerLink: {
    color: color.primary,
    fontFamily: fonts.MontBold,
  },
})