import React, { useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { ScaledSheet, ms } from 'react-native-size-matters'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { getLoyaltyBalance } from '../../services/loyaltyapi'
import color from '../../utils/color'
import FONTS from '../../utils/fonts'

const LoyaltyPointsWidget = ({ 
  style, 
  showConversion = true, 
  onPress, 
  compact = false,
  refreshKey = 0 
}) => {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchBalance()
  }, [refreshKey])

  const fetchBalance = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getLoyaltyBalance()
      if (response.success) {
        setBalance(response.data)
      } else {
        setError('Failed to load balance')
      }
    } catch (err) {
      console.error('Loyalty balance fetch error:', err)
      setError('Connection error')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.compactContainer, style]}>
        <ActivityIndicator size="small" color={color.primary} />
        {!compact && <Text style={styles.loadingText}>Loading...</Text>}
      </View>
    )
  }

  if (error || !balance) {
    return null // Don't show widget on error
  }

  const points = balance.loyaltyPointsBalance || 0
  const conversionRate = 0.10 // Default, could come from business settings
  const rupeeValue = points * conversionRate

  const WidgetContent = () => (
    <>
      <Icon name="star-circle" size={compact ? ms(16) : ms(20)} color={color.primary} />
      <View style={styles.textContainer}>
        <Text style={[styles.pointsText, compact && styles.compactPointsText]}>
          {points.toFixed(2)} Points
        </Text>
        {showConversion && !compact && (
          <Text style={styles.conversionText}>
            ≈ ₹{rupeeValue.toFixed(2)}
          </Text>
        )}
      </View>
      {onPress && (
        <Icon name="chevron-right" size={ms(16)} color="#888" />
      )}
    </>
  )

  if (onPress) {
    return (
      <TouchableOpacity 
        style={[styles.container, compact && styles.compactContainer, style]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <WidgetContent />
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, compact && styles.compactContainer, style]}>
      <WidgetContent />
    </View>
  )
}

const styles = ScaledSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: color.primary + '10',
    paddingHorizontal: '12@s',
    paddingVertical: '8@vs',
    borderRadius: '8@ms',
    borderWidth: 1,
    borderColor: color.primary + '30',
    gap: '8@s',
  },
  compactContainer: {
    paddingHorizontal: '8@s',
    paddingVertical: '6@vs',
    borderRadius: '6@ms',
    gap: '6@s',
  },
  textContainer: {
    flex: 1,
  },
  pointsText: {
    fontSize: '14@ms',
    fontFamily: FONTS.SemiBold,
    color: color.text,
  },
  compactPointsText: {
    fontSize: '12@ms',
  },
  conversionText: {
    fontSize: '11@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
    marginTop: '1@vs',
  },
  loadingText: {
    fontSize: '12@ms',
    color: '#666',
    fontFamily: FONTS.Regular,
    marginLeft: '8@s',
  },
})

export default LoyaltyPointsWidget
