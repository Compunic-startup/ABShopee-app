// import React, { useState, useRef, useEffect } from 'react'
// import {
//   View,
//   Text,
//   TouchableOpacity,
//   ToastAndroid,
//   Animated,
//   StatusBar,
//   KeyboardAvoidingView,
//   Platform,
// } from 'react-native'
// import { TextInput, Divider } from 'react-native-paper'
// import { ScaledSheet, moderateScale } from 'react-native-size-matters'
// import { useNavigation, useRoute } from '@react-navigation/native'
// import AsyncStorage from '@react-native-async-storage/async-storage'
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
// import color from '../../core/utils/color'
// import fonts from '../../core/utils/fonts'
// import BASE_URL from '../../core/services/api'
// import AppButton from '../../core/components/global/gloabloadingcomponent'

// export default function OTPScreen({ setIsLoggedIn }) {
//   const navigation = useNavigation()
//   const { params } = useRoute()
//   const { identifier, requestId } = params

//   const [otp, setOtp] = useState('')
//   const identifierType = identifier.includes('@') ? 'email' : 'phone'
//   const isValidOtp = otp.length === 6

//   // ── Animations ──────────────────────────────────────────────────────────────
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

//   // ── Verify OTP ──────────────────────────────────────────────────────────────
//   const verifyOtp = async () => {
//     if (!isValidOtp) return

//     try {
//       const res = await fetch(`${BASE_URL}/auth/login/otp/verify`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           identifier,
//           identifierType,
//           otp,
//           context: 'login',
//           requestId,
//           role: 'customer',
//         }),
//       })

//       if (!res.ok) {
//         const errorData = await res.json()
//         console.log('OTP verification failed:', errorData)
//         ToastAndroid.show(errorData?.message || 'OTP verification failed', ToastAndroid.SHORT)
//         return
//       }

//       const data = await res.json()
//       console.log('OTP verification response:', data)
//       const token = data?.data?.user?.accessToken
//       const customerId = data?.data?.user?.id


//       if (data?.data?.user?.identifier) {
//             await AsyncStorage.setItem(
//               'Identifier',
//               JSON.stringify(data?.data?.user?.identifier)
//             )
//           }

//       if (!token) {
//         ToastAndroid.show('Token not received', ToastAndroid.SHORT)
//         return
//       }

//       /* ---------- FETCH PROFILE HERE ---------- */

//       if (token) {
//         try {

//           const profileRes = await fetch(
//             `${BASE_URL}/customer/business/ad1351af-4c82-4206-9dee-2db2545acd19/customer-business-profile`,
//             {
//               method: 'GET',
//               headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${token}`,
//               },
//             }
//           )

//           const profileJson = await profileRes.json()
//           console.log(profileJson, 'Fetched profile during splash')

//           if (profileJson?.success && profileJson?.data) {
//             await AsyncStorage.setItem(
//               'userProfile',
//               JSON.stringify(profileJson.data)
//             )
//           }

//         } catch (err) {
//           console.log('Profile fetch failed during splash')
//         }
//       }

//       await AsyncStorage.setItem('userToken', token)
//       await AsyncStorage.setItem('customerId', customerId)
//       await AsyncStorage.getItem('userToken').then((value) => console.log('Stored token:', value))

//       if (!res.ok) {
//         console.log('OTP error:', data)
//         return
//       }

//       setIsLoggedIn(true)
//     } catch (err) {
//       console.log('Network error')
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

//         {/* Decorative blobs */}
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
//             Secure Login,{'\n'}
//             <Text style={styles.titleAccent}>Enter Your Code!</Text>
//           </Text>
//         </Animated.View>

//         {/* Card */}
//         <Animated.View
//           style={[styles.card, { opacity: cardFade, transform: [{ translateY: cardAnim }] }]}
//         >
//           {/* Card handle */}
//           <View style={styles.cardHandle} />

//           <Text style={styles.heading}>OTP Verification</Text>
//           <Text style={styles.subHeading}>
//             We've sent a 6-digit code to{' '}
//             <Text style={styles.identifierHighlight}>{identifier}</Text>
//           </Text>

//           {/* OTP Input */}
//           <View style={styles.inputWrapper}>
//             <TextInput
//               mode="outlined"
//               label="6-digit OTP"
//               keyboardType="number-pad"
//               value={otp}
//               onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
//               maxLength={6}
//               outlineColor="#E8ECF4"
//               activeOutlineColor={color.primary}
//               outlineStyle={{ borderRadius: moderateScale(14) }}
//               style={styles.input}
//               left={<TextInput.Icon icon={() => <Icon name="message-outline" size={18} color="#9AA3B2" />} />}
//               right={
//                 isValidOtp
//                   ? <TextInput.Icon icon={() => <Icon name="check-circle" size={18} color="#22C55E" />} />
//                   : null
//               }
//               theme={{
//                 fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
//                 colors: { onSurfaceVariant: '#9AA3B2' },
//               }}
//             />
//             {/* OTP dot counter */}
//             <View style={styles.otpDotsRow}>
//               {[0, 1, 2, 3, 4, 5].map((i) => (
//                 <View
//                   key={i}
//                   style={[styles.otpDot, i < otp.length && styles.otpDotFilled]}
//                 />
//               ))}
//             </View>
//           </View>

//           {/* Verify Button */}
//           <AppButton
//             mode="contained"
//             disabled={!isValidOtp}
//             onPress={verifyOtp}
//             style={[styles.button, !isValidOtp && styles.buttonDisabled]}
//             contentStyle={styles.buttonContent}
//           >
//             Verify & Continue →
//           </AppButton>

//           {/* Divider */}
//           <View style={styles.dividerRow}>
//             <Divider style={styles.divider} />
//             <Text style={styles.or}>Didn't receive code?</Text>
//             <Divider style={styles.divider} />
//           </View>

//           {/* Resend */}
//           <TouchableOpacity>
//             <Text style={styles.resend}>Resend OTP</Text>
//           </TouchableOpacity>
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
//     paddingHorizontal: '20@s',
//     paddingTop: '16@vs',
//   },
//   backBtn: {
//     width: '36@s',
//     height: '36@s',
//     borderRadius: '18@ms',
//     backgroundColor: 'rgba(255,255,255,0.15)',
//     alignItems: 'center',
//     justifyContent: 'center',
//   },

//   // ── Hero ────────────────────────────────────────────────────────────────────
//   hero: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: '12@s',
//   },
//   title: {
//     color: 'rgba(255,255,255,0.85)',
//     fontSize: '21@ms',
//     lineHeight: '31@vs',
//     fontFamily: fonts.MontBold,
//     textAlign: 'center',
//   },
//   titleAccent: {
//     color: '#fff',
//     fontSize: '23@ms',
//     fontWeight: '800',
//   },

//   // ── Card ────────────────────────────────────────────────────────────────────
//   card: {
//     backgroundColor: '#FAFBFF',
//     borderTopLeftRadius: '32@ms',
//     borderTopRightRadius: '32@ms',
//     paddingHorizontal: '24@s',
//     paddingTop: '10@vs',
//     paddingBottom: '32@vs',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: -6 },
//     shadowOpacity: 0.08,
//     shadowRadius: 20,
//     elevation: 16,
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
//     color: '#001e48',
//     fontSize: '12@ms',
//     fontFamily: fonts.MontRegular,
//     lineHeight: '18@vs',
//     marginBottom: '14@vs',
//   },
//   identifierHighlight: {
//     color: color.primary,
//     fontFamily: fonts.MontBold,
//   },

//   // ── Input ───────────────────────────────────────────────────────────────────
//   inputWrapper: {
//     position: 'relative',
//     marginBottom: '10@vs',
//   },
//   input: {
//     backgroundColor: '#fff',
//     fontSize: '13@ms',
//     fontFamily: fonts.MontRegular,
//   },

//   // OTP dots
//   otpDotsRow: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     gap: '6@s',
//     marginTop: '8@vs',
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

//   // ── Resend ──────────────────────────────────────────────────────────────────
//   resend: {
//     textAlign: 'center',
//     color: color.primary,
//     fontSize: '13@ms',
//     fontFamily: fonts.MontBold,
//   },
// })

import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
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

export default function OTPScreen({ setIsLoggedIn }) {
  const navigation = useNavigation()
  const { params } = useRoute()
  const { identifier, requestId } = params

  const [otp, setOtp] = useState('')
  const identifierType = identifier.includes('@') ? 'email' : 'phone'
  const isValidOtp = otp.length === 6

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

  // ── Verify OTP ──────────────────────────────────────────────────────────────
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

      if (!res.ok) {
        const errorData = await res.json()
        console.log('OTP verification failed:', errorData)
        ToastAndroid.show(errorData?.message || 'OTP verification failed', ToastAndroid.SHORT)
        return
      }

      const data = await res.json()
      console.log('OTP verification response:', data)
      const token = data?.data?.user?.accessToken
      const customerId = data?.data?.user?.id

      if (data?.data?.user?.identifier) {
        await AsyncStorage.setItem(
          'Identifier',
          JSON.stringify(data?.data?.user?.identifier)
        )
      }

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
      await AsyncStorage.getItem('userToken').then((value) =>
        console.log('Stored token:', value)
      )

      if (!res.ok) {
        console.log('OTP error:', data)
        return
      }

      setIsLoggedIn(true)
    } catch (err) {
      console.log('Network error')
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
          {/* OTP Icon Badge */}
          <View style={styles.iconBadge}>
            <Icon name="message-lock-outline" size={moderateScale(28)} color={color.primary} />
          </View>

          <Text style={styles.welcomeText}>OTP Verification 🔐</Text>
          <Text style={styles.appNameRow}>
            Enter your{' '}
            <Text style={styles.appNameAccent}>6-digit code</Text>
          </Text>
          <Text style={styles.subHeading}>
            We've sent a code to{' '}
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
          {/* OTP Input */}
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
                  icon={() => (
                    <Icon name="message-outline" size={18} color="#9AA3B2" />
                  )}
                />
              }
              right={
                isValidOtp ? (
                  <TextInput.Icon
                    icon={() => (
                      <Icon name="check-circle" size={18} color="#22C55E" />
                    )}
                  />
                ) : null
              }
              theme={{
                fonts: { bodyLarge: { fontFamily: fonts.MontRegular } },
                colors: { onSurfaceVariant: '#9AA3B2' },
              }}
            />

            {/* OTP dot progress */}
            <View style={styles.otpDotsRow}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.otpDot,
                    i < otp.length && styles.otpDotFilled,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Verify Button */}
          <AppButton
            mode="contained"
            disabled={!isValidOtp}
            onPress={verifyOtp}
            style={[styles.button, !isValidOtp && styles.buttonDisabled]}
            contentStyle={styles.buttonContent}
          >
            Verify & Continue
          </AppButton>

          {/* Resend Row */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive the code? </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View style={[styles.footer, { opacity: cardFade }]}>
          <Text style={styles.footerText}>
            Having trouble?{' '}
            <Text style={styles.footerLink}>Contact Support</Text>
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
    marginBottom: '28@vs',
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
    marginBottom: '36@vs',
  },
  iconBadge: {
    width: '60@s',
    height: '60@s',
    borderRadius: '18@ms',
    backgroundColor: '#F0F4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20@vs',
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
    marginBottom: '10@vs',
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
  identifierHighlight: {
    color: color.primary,
    fontFamily: fonts.MontBold,
  },

  // ── Form Block ───────────────────────────────────────────────────────────────
  formBlock: {
    flex: 1,
  },

  // ── Input ────────────────────────────────────────────────────────────────────
  inputWrapper: {
    marginBottom: '20@vs',
  },
  input: {
    backgroundColor: '#fff',
    fontSize: '16@ms',
    fontFamily: fonts.MontBold,
    letterSpacing: '4@ms',
  },

  // OTP dots
  otpDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: '8@s',
    marginTop: '12@vs',
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

  // ── Resend ───────────────────────────────────────────────────────────────────
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendLabel: {
    fontSize: '12@ms',
    color: '#9AA3B2',
    fontFamily: fonts.MontRegular,
  },
  resendLink: {
    fontSize: '12@ms',
    color: color.primary,
    fontFamily: fonts.MontBold,
  },

  // ── Footer ───────────────────────────────────────────────────────────────────
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '24@vs',
  },
  footerText: {
    textAlign: 'center',
    fontSize: '11@ms',
    color: '#94A3B8',
    fontFamily: fonts.MontRegular,
  },
  footerLink: {
    color: color.primary,
    fontFamily: fonts.MontBold,
  },
})