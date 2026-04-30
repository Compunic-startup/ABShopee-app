import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Dimensions, Animated, Image } from 'react-native'
import LottieView from 'lottie-react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BASE_URL from '../core/services/api'
import color from '../core/utils/color'

const { width, height } = Dimensions.get('window')

export default function SplashScreen({ setIsLoggedIn }) {

  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {

    const initializeApp = async () => {
      try {

        const token = await AsyncStorage.getItem('userToken')
        
        const businessId = 'ad1351af-4c82-4206-9dee-2db2545acd19'

        await AsyncStorage.setItem(
          'businessId',
          businessId
        )

        /* ---------- FETCH PROFILE HERE ---------- */

        if (token) {
          try {

            const profileRes = await fetch(
              `${BASE_URL}/customer/business/${businessId}/customer-business-profile`,
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
            console.log(token)

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

        /* ---------- CONTINUE ---------- */

        setTimeout(() => {
          setIsLoggedIn(!!token)
        }, 500)

      } catch (error) {
        console.log('Business fetch failed, staying on splash...')
        return
      }
    }

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start()

    initializeApp()

  }, [])

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/animations/splash.json')}
        resizeMode="cover"
        autoPlay
        loop={false}
        style={styles.lottie}
      />

      <Animated.View style={[styles.logoWrapper, { opacity: fadeAnim }]}>
        <Image
          source={require('../core/assets/images/constants/splashlogo2.png')}
          style={styles.logo}
        />
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.primary,
  },
  lottie: {
    position: 'absolute',
    width: '0%',
    height: '0%',
    transform: [{ scale: 1.15 }],
  },
  logoWrapper: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 220,
    height: 220,
    resizeMode: 'contain',
  },
})