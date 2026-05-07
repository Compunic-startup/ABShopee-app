import BASE_URL from './api'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Balance Management ───────────────────────────────────────────────────────
export const getLoyaltyBalance = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')
    
    if (!token || !businessId) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/balance`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  } catch (error) {
    console.error('Error fetching loyalty balance:', error)
    throw error
  }
}

// ── Transaction History ───────────────────────────────────────────────────────
export const getLoyaltyHistory = async (page = 1, limit = 20) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')
    
    if (!token || !businessId) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/history?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  } catch (error) {
    console.error('Error fetching loyalty history:', error)
    throw error
  }
}

// ── Points Calculation Preview ─────────────────────────────────────────────────
export const calculateLoyaltyPoints = async (orderDetails) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')
    
    if (!token || !businessId) {
      throw new Error('Authentication required')
    }

    const requestBody = JSON.stringify({ orderDetails })
    console.log('Loyalty API Request Body:', requestBody)
    
    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: requestBody,
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  } catch (error) {
    console.error('Error calculating loyalty points:', error)
    throw error
  }
}

// ── Complete Loyalty Info ─────────────────────────────────────────────────────
export const getCustomerLoyaltyInfo = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')
    
    if (!token || !businessId) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/customer/loyalty-info`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })


    const data = await response.json()
    console.log("data is",data)
    if (!response.ok) {
      throw data
    }

    return data
  } catch (error) {
    console.error('Error fetching loyalty info:', error)
    throw error
  }
}

// ── Points Validation ──────────────────────────────────────────────────────────
export const validatePointsRedemption = async (pointsToUse, orderTotal) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')
    
    if (!token || !businessId) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pointsToUse, orderTotal }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  } catch (error) {
    console.error('Error validating points:', error)
    throw error
  }
}

// ── Smart Points Suggestions ─────────────────────────────────────────────────
export const getPointsSuggestions = async (orderTotal, cartItems) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')
    
    if (!token || !businessId) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ orderTotal, cartItems }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  } catch (error) {
    console.error('Error getting points suggestions:', error)
    throw error
  }
}

// ── Points Expiry Information ──────────────────────────────────────────────────
export const getPointsExpiry = async (days = 30) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')
    
    if (!token || !businessId) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/expiry?days=${days}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  } catch (error) {
    console.error('Error fetching points expiry:', error)
    throw error
  }
}

// ── Loyalty Analytics ─────────────────────────────────────────────────────────
export const getLoyaltyAnalytics = async (period = 90) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')
    
    if (!token || !businessId) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/analytics?period=${period}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  } catch (error) {
    console.error('Error fetching loyalty analytics:', error)
    throw error
  }
}

// ── Points Redemption Simulation ──────────────────────────────────────────────
export const simulatePointsRedemption = async (pointsToUse, orderTotal, orderDetails) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')
    
    if (!token || !businessId) {
      throw new Error('Authentication required')
    }

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ pointsToUse, orderTotal, orderDetails }),
    })

    const data = await response.json()
    
    if (!response.ok) {
      throw data
    }

    return data
  } catch (error) {
    console.error('Error simulating points redemption:', error)
    throw error
  }
}
