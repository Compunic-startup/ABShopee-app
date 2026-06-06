import BASE_URL from './api'
import AsyncStorage from '@react-native-async-storage/async-storage'

// ── Rewards & Milestones (Main dashboard endpoint) ───────────────────────────
// GET /loyalty/rewards
// Returns: availablePoints, milestones, rewardClaims, nextMilestone, isRegistered
export const getLoyaltyRewards = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')

    if (!token || !businessId) throw new Error('Authentication required')

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/rewards`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })

    const data = await response.json()
    console.log('getLoyaltyRewards data:', data)
    if (!response.ok) throw data
    return data
  } catch (error) {
    console.error('Error fetching loyalty rewards:', error)
    throw error
  }
}

// ── Redeem Milestone Gift ─────────────────────────────────────────────────────
// POST /loyalty/redeem-gift
export const redeemMilestoneGift = async (milestoneId) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')

    if (!token || !businessId) throw new Error('Authentication required')

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/redeem-gift`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ milestoneId }),
    })

    const data = await response.json()
    console.log('redeemMilestoneGift data:', data)
    if (!response.ok) throw data
    return data
  } catch (error) {
    console.error('Error redeeming milestone gift:', error)
    throw error
  }
}

// ── Reward Claims ─────────────────────────────────────────────────────────────
// GET /loyalty/claims
export const getRewardClaims = async () => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')

    if (!token || !businessId) throw new Error('Authentication required')

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/claims`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })

    const data = await response.json()
    console.log('getRewardClaims data:', data)
    if (!response.ok) throw data
    return data
  } catch (error) {
    console.error('Error fetching reward claims:', error)
    throw error
  }
}

// ── Smart Points Suggestions (Cart/Checkout) ──────────────────────────────────
// POST /loyalty/suggestions
export const getPointsSuggestions = async (orderTotal, cartItems) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')

    if (!token || !businessId) throw new Error('Authentication required')

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/suggestions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ orderTotal, cartItems }),
    })

    const data = await response.json()
    console.log('getPointsSuggestions data:', data)
    if (!response.ok) throw data
    return data
  } catch (error) {
    console.error('Error getting points suggestions:', error)
    throw error
  }
}

// ── Points Validation (Checkout manual entry) ─────────────────────────────────
// POST /loyalty/validate
export const validatePointsRedemption = async (pointsToUse, orderTotal) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')

    if (!token || !businessId) throw new Error('Authentication required')

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pointsToUse, orderTotal }),
    })

    const data = await response.json()
    console.log('validatePointsRedemption data:', data)
    if (!response.ok) throw data
    return data
  } catch (error) {
    console.error('Error validating points:', error)
    throw error
  }
}

// ── Points Redemption Simulation (Pricing Preview) ────────────────────────────
// POST /loyalty/simulate
export const simulatePointsRedemption = async (pointsToUse, orderTotal, orderDetails) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')

    if (!token || !businessId) throw new Error('Authentication required')

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ pointsToUse, orderTotal, orderDetails }),
    })

    const data = await response.json()
    console.log('simulatePointsRedemption data:', data)
    if (!response.ok) throw data
    return data
  } catch (error) {
    console.error('Error simulating points redemption:', error)
    throw error
  }
}

// ── Points Expiry Information ─────────────────────────────────────────────────
// GET /loyalty/expiry?days=30
export const getPointsExpiry = async (days = 30) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')

    if (!token || !businessId) throw new Error('Authentication required')

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/expiry?days=${days}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })

    const data = await response.json()
    console.log('getPointsExpiry data:', data)
    if (!response.ok) throw data
    return data
  } catch (error) {
    console.error('Error fetching points expiry:', error)
    throw error
  }
}

// ── Loyalty Analytics (History tab summary) ───────────────────────────────────
// GET /loyalty/analytics?period=90
export const getLoyaltyAnalytics = async (period = 90) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')

    if (!token || !businessId) throw new Error('Authentication required')

    const response = await fetch(`${BASE_URL}/customer/business/${businessId}/loyalty/analytics?period=${period}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    })

    const data = await response.json()
    console.log('getLoyaltyAnalytics data:', data)
    if (!response.ok) throw data
    return data
  } catch (error) {
    console.error('Error fetching loyalty analytics:', error)
    throw error
  }
}

// ── Place Gift-Only Order ─────────────────────────────────────────────────────
// Uses the standard /orders/:itemId/place endpoint with redeemedRewardClaimId.
// Flow: redeemMilestoneGift() → {rewardClaimId, rewardItemId} → placeGiftOrder()
export const placeGiftOrder = async ({
  rewardItemId,
  rewardClaimId,
  quantity = 1,
  addressSnapshot,
  contactSnapshot,
}) => {
  try {
    const token = await AsyncStorage.getItem('userToken')
    const businessId = await AsyncStorage.getItem('businessId')

    if (!token || !businessId) throw new Error('Authentication required')

    const payload = {
      quantity,
      itemType: 'physical',
      addresses: [
        {
          type: 'shipping',
          addressSnapshot,
          contactSnapshot,
        },
      ],
      payment: { method: 'COD' },
      redeemedRewardClaimId: rewardClaimId,
    }

    const response = await fetch(
      `${BASE_URL}/customer/business/${businessId}/orders/${rewardItemId}/place`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      }
    )

    const data = await response.json()
    console.log('placeGiftOrder response:', data)
    if (!response.ok) throw data
    return data
  } catch (error) {
    console.error('Error placing gift order:', error)
    throw error
  }
}
