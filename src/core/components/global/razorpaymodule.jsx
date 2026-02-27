import RazorpayCheckout from 'react-native-razorpay'
import { ToastAndroid } from 'react-native'
import BASE_URL from '../../services/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const openRazorpay = async ({
  razorpayOrder,
  orderId,
  navigation,
  email
}) => {
  const options = {
    key: 'rzp_test_RD4LUvyj0ffvxI',
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    order_id: razorpayOrder.orderId,
    name: 'AB Shopee',
    description: 'Complete Order Payment',
    prefill: {
      name: 'Customer Name',
      contact: 'Customer Phone',
    },
    theme: { color: '#0A64FF' },
  }

  try {
    const data = await RazorpayCheckout.open(options)
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')
    const res = await fetch(
      `${BASE_URL}/customer/business/${businessId}/orders/${orderId}/verify/payment`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpayPaymentId: data.razorpay_payment_id,
          razorpayOrderId: data.razorpay_order_id,
          razorpaySignature: data.razorpay_signature,
          email : email
        }),

      }
    )

    const json = await res.json()
    console.log('Payment verification response', json)
    if (!res.ok) throw json

    ToastAndroid.show('Payment Successful 🎉', ToastAndroid.SHORT)
    navigation.replace('OrderPlacedAnimation')
  } catch (err) {
    if (err?.code === 0) {
      ToastAndroid.show('Payment cancelled', ToastAndroid.SHORT)
    } else {
      ToastAndroid.show('Payment failed', ToastAndroid.SHORT)
      console.log('Razorpay error', err)
    }
  }
}
