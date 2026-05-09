import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native'
import LottieView from 'lottie-react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import FONTS from '../../utils/fonts'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'

const { height } = Dimensions.get('window')

export default function OrderSuccess() {
    const navigation = useNavigation()
    const route = useRoute()
    const pointsEarned = route.params?.pointsEarned || 0

    const translateY = useRef(new Animated.Value(height)).current
    const opacity = useRef(new Animated.Value(0)).current

    useEffect(() => {
        const animationTimer = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: height * 0.5 - 60,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start()
        }, 2000)

        const navigationTimer = setTimeout(() => {
            navigation.goBack()
        }, 5500)

        return () => {
            clearTimeout(animationTimer)
            clearTimeout(navigationTimer)
        }
    }, [])

    return (
        <View style={styles.container}>
            <LottieView
                source={require('../../../../assets/animations/OrderPlaced.json')}
                autoPlay
                loop={false}
                resizeMode="cover"
                style={styles.lottie}
                duration={4000}
            />

            <Animated.View
                style={[
                    styles.textContainer,
                    {
                        transform: [{ translateY }],
                        opacity,
                    },
                ]}
            >
                <Text style={styles.heading}>
                    Order Placed Successfully.
                </Text>
                <Text style={styles.subHeading}>
                    Thank you for shopping with AB Shopee!
                </Text>
                
                {pointsEarned > 0 && (
                    <View style={styles.pointsMinimal}>
                        <Icon name="star-circle" size={20} color="#FFD700" />
                        <Text style={styles.pointsTextMinimal}>
                            You earned {pointsEarned} points (₹{(pointsEarned * 0.10).toFixed(2)})
                        </Text>
                    </View>
                )}
            </Animated.View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    lottie: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    textContainer: {
        position: 'absolute',
        width: '100%',
        alignItems: 'center',
    },
    heading: {
        fontSize: 22,
        fontWeight: '900',
        color: '#fff',
    },
    subHeading: {
        fontSize: 14,
        color: '#E0E0E0',
        marginTop: 6,
        fontWeight: '900',
    },
    pointsMinimal: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        gap: 6,
    },
    pointsTextMinimal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFD700',
    },
})
