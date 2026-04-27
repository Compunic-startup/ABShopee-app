import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import FONTS from '../../../utils/fonts'
import color from '../../../utils/color'
import AsyncStorage from '@react-native-async-storage/async-storage'
import BASE_URL from '../../../services/api'

export default function OrderPendingApprovalScreen() {
  const navigation = useNavigation()
  const { orderId } = useRoute().params
  const [fadeAnim] = useState(new Animated.Value(0))

  // Validate orderId param
  useEffect(() => {
    if (!orderId) {
      ToastAndroid.show('Invalid order. Please try again.', ToastAndroid.LONG)
      navigation.goBack()
    }
  }, [orderId])

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [])

  const goToOrders = () => {
    try {
     navigation.navigate('Tabs', { screen: 'Orders' })
    } catch (error) {
      ToastAndroid.show('Unable to navigate to orders', ToastAndroid.SHORT)
    }
  }

  const goToHome = () => {
    try {
      navigation.navigate('Tabs')
    } catch (error) {
      ToastAndroid.show('Unable to navigate to home', ToastAndroid.SHORT)
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Pending Approval</Text>
        <View style={{ width: s(40) }} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Success Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconBg}>
            <Icon name="clock-outline" size={ms(60)} color={color.primary} />
          </View>
        </View>

        {/* Main Message */}
        <View style={styles.messageContainer}>
          <Text style={styles.title}>Order Requires Approval</Text>
          <Text style={styles.subtitle}>
            Because you ordered a bulk quantity, your order requires seller approval.
          </Text>
          <Text style={styles.description}>
            You will receive an email and notification once it is approved. Please then return to make your payment.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={goToHome}
            activeOpacity={0.8}
          >
            <Icon name="home" size={ms(18)} color={color.primary} />
            <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={goToOrders}
            activeOpacity={0.8}
          >
            <Icon name="format-list-bulleted" size={ms(18)} color="#fff" />
            <Text style={styles.primaryButtonText}>View Orders</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpContainer}>
          <Icon name="help-circle-outline" size={ms(16)} color="#888" />
          <Text style={styles.helpText}>
            Need help? Contact our support team for assistance with bulk orders.
          </Text>
        </View>
      </Animated.View>
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    flex: 1,
    backgroundColor: color.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: color.primary,
    paddingHorizontal: '14@s',
    paddingVertical: '13@vs',
    elevation: 4,
  },
  headerBtn: {
    width: '36@s',
    height: '36@s',
    borderRadius: '18@ms',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '17@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: '20@s',
    paddingTop: '40@vs',
  },

  // Icon Container
  iconContainer: {
    alignItems: 'center',
    marginBottom: '30@vs',
  },
  iconBg: {
    width: '120@s',
    height: '120@s',
    borderRadius: '60@ms',
    backgroundColor: color.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: color.primary + '30',
  },

  // Message
  messageContainer: {
    alignItems: 'center',
    marginBottom: '30@vs',
  },
  title: {
    fontSize: '24@ms',
    fontFamily: FONTS.Bold,
    color: color.text,
    textAlign: 'center',
    marginBottom: '12@vs',
  },
  subtitle: {
    fontSize: '16@ms',
    fontFamily: FONTS.Medium,
    color: color.text,
    textAlign: 'center',
    marginBottom: '8@vs',
    lineHeight: '22@vs',
  },
  description: {
    fontSize: '14@ms',
    fontFamily: FONTS.Regular,
    color: '#666',
    textAlign: 'center',
    lineHeight: '20@vs',
    paddingHorizontal: '10@s',
  },

  // Order Info
  orderInfo: {
    backgroundColor: '#fff',
    borderRadius: '12@ms',
    padding: '16@s',
    marginBottom: '30@vs',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: '8@vs',
  },
  orderInfoLabel: {
    flex: 1,
    fontSize: '14@ms',
    fontFamily: FONTS.Medium,
    color: '#666',
    marginLeft: '12@s',
  },
  orderInfoValue: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: color.text,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '6@s',
    backgroundColor: color.secondary + '20',
    paddingHorizontal: '12@s',
    paddingVertical: '6@vs',
    borderRadius: '20@ms',
  },
  statusText: {
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
    color: color.secondary,
  },

  // What's Next
  whatsNext: {
    backgroundColor: '#fff',
    borderRadius: '12@ms',
    padding: '16@s',
    marginBottom: '30@vs',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  whatsNextTitle: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
    color: color.text,
    marginBottom: '16@vs',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: '12@vs',
  },
  stepNumber: {
    width: '24@s',
    height: '24@s',
    borderRadius: '12@ms',
    backgroundColor: color.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '12@s',
  },
  stepNumberText: {
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
  stepText: {
    flex: 1,
    fontSize: '14@ms',
    fontFamily: FONTS.Regular,
    color: color.text,
    lineHeight: '18@vs',
  },

  // Buttons
  buttonContainer: {
    gap: '12@vs',
    marginBottom: '20@vs',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8@s',
    backgroundColor: color.primary,
    paddingVertical: '14@vs',
    borderRadius: '8@ms',
    elevation: 2,
  },
  primaryButtonText: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8@s',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: color.primary,
    paddingVertical: '14@vs',
    borderRadius: '8@ms',
  },
  secondaryButtonText: {
    fontSize: '16@ms',
    fontFamily: FONTS.Bold,
    color: color.primary,
  },

  // Help
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    paddingHorizontal: '10@s',
    paddingVertical: '12@vs',
  },
  helpText: {
    flex: 1,
    fontSize: '13@ms',
    fontFamily: FONTS.Regular,
    color: '#666',
    lineHeight: '18@vs',
  },
})
