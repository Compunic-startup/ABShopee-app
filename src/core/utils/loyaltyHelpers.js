// Loyalty tier calculation helpers

export const calculateTierInfo = (loyaltyData) => {
  if (!loyaltyData?.loyaltyRules || !Array.isArray(loyaltyData.loyaltyRules)) {
    return { currentTier: null, nextTier: null }
  }

  // Sort rules by threshold (ascending)
  const sortedRules = loyaltyData.loyaltyRules
    .filter(rule => rule.status === 'active')
    .sort((a, b) => a.earnThresholdValue - b.earnThresholdValue)

  // Find current tier based on lifetime spend
  const lifetimeSpend = loyaltyData.lifetimeSpend || 0
  let currentTierInfo = null
  let nextTierInfo = null

  for (let i = 0; i < sortedRules.length; i++) {
    const rule = sortedRules[i]
    if (lifetimeSpend >= rule.earnThresholdValue) {
      currentTierInfo = { ...rule, tierIndex: i }
    } else {
      nextTierInfo = { ...rule, tierIndex: i }
      break
    }
  }

  return { currentTier: currentTierInfo, nextTier: nextTierInfo }
}

export const getActiveRule = (loyaltyData) => {
  const { currentTier } = calculateTierInfo(loyaltyData)
  if (currentTier) return currentTier
  
  // Fallback to first active rule if no tier reached yet (or first rule if none marked active)
  return loyaltyData?.loyaltyRules?.find(rule => rule.status !== 'inactive') || loyaltyData?.loyaltyRules?.[0] || null
}

export const getConversionRate = (loyaltyData) => {
  const activeRule = getActiveRule(loyaltyData)
  return activeRule?.conversionRate || 0.10
}

export const getMinPointsToRedeem = (loyaltyData) => {
  const activeRule = getActiveRule(loyaltyData)
  return activeRule?.minPointsToRedeem || 0
}
