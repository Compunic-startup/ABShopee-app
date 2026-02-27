import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Dimensions, Animated, Image } from 'react-native'
import LottieView from 'lottie-react-native'
import { useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BASE_URL from '../core/services/api'

const { width, height } = Dimensions.get('window')

export default function SplashScreen({ isLoggedIn }) {
    const navigation = useNavigation()
    const fadeAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const initializeApp = async () => {
            try {
                const response = await fetch(`${BASE_URL}/open/business/info`)
                const result = await response.json()

                console.log('Business fetch success:', result)

                if (result?.data) {
                    await AsyncStorage.setItem(
                        'businessData',
                        JSON.stringify(result.data)
                    )

                    await AsyncStorage.setItem(
                        'businessId',
                        result.data.id
                    )
                    console.log(result.data.id)
                }
            } catch (error) {
                console.log('Business fetch error:', error)
            }

            navigation.replace(isLoggedIn ? 'HomeScreen' : 'LoginScreen')
        }

        const fadeTimer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start()
        }, 1000)

        const initTimer = setTimeout(() => {
            initializeApp()
        }, 2000)

        return () => {
            clearTimeout(fadeTimer)
            clearTimeout(initTimer)
        }
    }, [isLoggedIn])

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
                    source={require('../core/assets/images/constants/logolight.png')}
                    style={styles.logo}
                />
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    lottie: {
        position: 'absolute',
        width: '100%',
        height: '100%',
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