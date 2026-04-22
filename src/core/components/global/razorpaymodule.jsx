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
  try {
    console.log('Opening Razorpay with:', { razorpayOrder, orderId, email })
    
    // Validate required parameters
    if (!razorpayOrder) {
      ToastAndroid.show('Invalid payment order', ToastAndroid.LONG)
      return
    }
    
    if (!razorpayOrder.orderId) {
      ToastAndroid.show('Payment order ID missing', ToastAndroid.LONG)
      return
    }
    
    if (!razorpayOrder.amount || razorpayOrder.amount <= 0) {
      ToastAndroid.show('Invalid payment amount', ToastAndroid.LONG)
      return
    }
    
    if (!orderId) {
      ToastAndroid.show('Order ID missing', ToastAndroid.LONG)
      return
    }

    const options = {
      key: 'rzp_test_Sg3m3HuucI2WSa',
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency || 'INR',
      order_id: razorpayOrder.orderId,
      name: 'AB Shopee',
      description: `Order #${orderId.slice(-8).toUpperCase()}`,
      prefill: {
        email: email || 'customer@example.com',
        name: 'Customer Name',
        contact: '9999999999',
      },
      theme: { color: '#0B77A7' },
      modal: {
        escape: false,
        handleback: false,
        confirmclose: true,
        animation: 'slideFromBottom',
        backdropclose: false,
        timeout: 300, // 5 minutes timeout
      },
      readonly: {
        email: false,
        contact: false,
        name: false,
      },
      config: {
        display: {
          blocks: {
            banks: false, // Hide bank selection for test
          },
          preferences: {
            order: ['card', 'wallet', 'upi'] // Prioritize card payment
          }
        }
      }
    }

    console.log('Razorpay options:', options)

    const data = await RazorpayCheckout.open(options)
    console.log('Razorpay payment data:', data)

    // Validate payment response
    if (!data.razorpay_payment_id) {
      ToastAndroid.show('Payment verification failed', ToastAndroid.LONG)
      return
    }

    // Get authentication tokens
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')
    
    if (!token || !businessId) {
      ToastAndroid.show('Authentication required. Please login again.', ToastAndroid.LONG)
      navigation.navigate('LoginScreen')
      return
    }

    console.log('Verifying payment with server...')
    
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
          email: email || ''
        }),
      }
    )
    
    const json = await res.json()
    console.log('Payment verification response:', json)
    
    if (!res.ok) {
      console.log('Payment verification failed:', json)
      throw json
    }

    ToastAndroid.show('Payment Successful \ud83c\udf89', ToastAndroid.SHORT)
    navigation.replace('OrderPlacedAnimation')
    
  } catch (err) {
    console.log('Razorpay error details:', err)
    
    // Handle payment cancellation (most common case)
    if (err?.code === 0) {
      ToastAndroid.show('Payment cancelled by user', ToastAndroid.SHORT)
      return
    }
    
    // Parse error description if it's a stringified JSON
    let errorData = err
    if (typeof err?.description === 'string' && err.description.startsWith('{')) {
      try {
        errorData = JSON.parse(err.description)
      } catch (e) {
        console.log('Could not parse error description')
      }
    }
    
    // Handle specific error cases
    if (errorData?.error?.code === 'BAD_REQUEST_ERROR') {
      if (errorData?.error?.reason === 'payment_cancelled') {
        ToastAndroid.show('Payment cancelled. Please try again.', ToastAndroid.SHORT)
      } else {
        ToastAndroid.show('Payment failed. Please try again.', ToastAndroid.LONG)
      }
    } else if (errorData?.error?.code === 'SERVER_ERROR') {
      ToastAndroid.show('Server error. Please try again later.', ToastAndroid.LONG)
    } else if (errorData?.error?.description) {
      ToastAndroid.show(errorData.error.description, ToastAndroid.LONG)
    } else if (err?.message) {
      ToastAndroid.show(err.message, ToastAndroid.LONG)
    } else {
      ToastAndroid.show('Payment failed. Please try again.', ToastAndroid.LONG)
    }
  }
}