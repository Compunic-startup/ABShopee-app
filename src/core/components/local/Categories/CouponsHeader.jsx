import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import color from '../../../utils/color'

// ─── Config ───────────────────────────────────────────────────────────────────
const CARD_WIDTH = s(150)
const CARD_GAP = s(10)
const SCROLL_SPEED = 40

const TYPE_CONFIG = {
  percentage: { icon: 'brightness-percent',     color: color.primary, bg: '#E3F2FD', label: 'OFF'      },
  flat:        { icon: 'currency-inr',       color: color.primary, bg: '#E8F5E9', label: 'FLAT'     },
  bogo:        { icon: 'gift-open',          color: color.primary, bg: '#F3E5F5', label: 'B1G1'     },
  free_gift:   { icon: 'gift',              color: color.primary, bg: '#FFF3E0', label: 'FREE GIFT' },
  free_shipping:{ icon: 'truck-fast',       color: color.primary, bg: '#E0F2F1', label: 'SHIPPING'  },
}

const CATEGORY_ACCENT = {
  promotion: '#4398ff',
  wholesale: '#42A5F5',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatValue = (type, value) => {
  if (type === 'percentage')    return `${parseFloat(value).toFixed(0)}%`
  if (type === 'flat')          return `₹${parseFloat(value).toFixed(0)}`
  if (type === 'bogo')          return 'B1G1'
  if (type === 'free_gift')     return 'Gift'
  if (type === 'free_shipping') return 'Free'
  return value
}

// ─── Single coupon pill card ──────────────────────────────────────────────────
function CouponPill({ item, onPress }) {
  const typeConf = TYPE_CONFIG[item.discountType] ?? TYPE_CONFIG.percentage
  const accent   = CATEGORY_ACCENT[item.discountCategory] ?? '#2894c6'
  const value    = formatValue(item.discountType, item.value)
  const hasCode  = !!item.code
  const scaleAnim = useRef(new Animated.Value(1)).current

  const pressIn  = () => Animated.spring(scaleAnim, { toValue: 0.95, useNativeDriver: true }).start()
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true }).start()

  return (
    <Animated.View style={[styles.pill, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        activeOpacity={1}
        style={styles.pillInner}
      >
        {/* Top accent bar */}
        <View style={[styles.pillAccentBar, { backgroundColor: accent }]} />

        {/* Icon circle */}
        <View style={[styles.iconCircle, { backgroundColor: color.primary }]}>
          <Icon name={typeConf.icon} size={ms(20)} color={color.secondary} />
        </View>

        {/* Value */}
        <Text style={[styles.pillValue, { color: typeConf.color }]} numberOfLines={1}>
          {value}
        </Text>
        <Text style={styles.pillLabel}>{typeConf.label}</Text>

        {/* Name */}
        <Text style={styles.pillName} numberOfLines={2}>{item.name}</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function CouponsHeader() {
  const navigation = useNavigation()
  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading]   = useState(true)
  const scrollX    = useRef(new Animated.Value(0)).current
  const animRef    = useRef(null)
  const pausedAt   = useRef(0)

  // Fetch a small page of discounts
  useEffect(() => {
    const load = async () => {
      try {
        const token      = await AsyncStorage.getItem('userToken')
        const businessId = await AsyncStorage.getItem('businessId')
        if (!token || !businessId) throw new Error('Missing token or businessId')
        const res  = await fetch(
          `${BASE_URL}/customer/business/${businessId}/discounts?page=1&limit=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        const json = await res.json()
        if (json.success) setDiscounts(json.data.discounts ?? [])
      } catch (e) {
        console.log('HomeCoupons fetch error', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const items = discounts.length > 0 ? [...discounts, ...discounts] : []
  const totalWidth = items.length * (CARD_WIDTH + CARD_GAP)

  const startScroll = useCallback((fromValue) => {
    if (items.length === 0) return
    const halfWidth  = totalWidth / 2      
    const remaining  = halfWidth - (fromValue % halfWidth)
    const duration   = (remaining / SCROLL_SPEED) * 1000

    animRef.current = Animated.timing(scrollX, {
      toValue:        fromValue + remaining,
      duration,
      easing:         Easing.linear,
      useNativeDriver: true,
    })
    animRef.current.start(({ finished }) => {
      if (finished) {
        scrollX.setValue(0)
        pausedAt.current = 0
        startScroll(0)
      }
    })
  }, [items.length, totalWidth, scrollX])

  useEffect(() => {
    if (!loading && items.length > 0) {
      startScroll(pausedAt.current)
    }
    return () => animRef.current?.stop()
  }, [loading, startScroll])

  const handlePress = () => navigation.navigate('coupondiscounts')

  if (loading || discounts.length === 0) return null

  const translateX = scrollX.interpolate({
    inputRange:  [0, totalWidth],
    outputRange: [0, -totalWidth],
    extrapolate: 'clamp',
  })

  return (
    <View style={styles.container}>
      <View style={styles.strip}>
        <Animated.View style={[styles.scrollRow, { transform: [{ translateX }] }]}>
          {items.map((item, idx) => (
            <CouponPill
              key={`${item.discountId}-${idx}`}
              item={item}
              onPress={handlePress}
            />
          ))}
        </Animated.View>
      </View>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: {
    marginTop: '8@vs',
    marginBottom: '4@vs',
  },

  // ── Header ────────────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '16@s',
    marginBottom: '10@vs',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
  },
  sectionIconWrap: {
    width: '26@s',
    height: '26@s',
    borderRadius: '8@ms',
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '14@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '2@s',
  },
  seeAllText: {
    fontSize: '12@ms',
    fontFamily: FONTS.Bold,
    color: '#000000',
  },

  // ── Scroll strip ──────────────────────────────────────────────────────────
  strip: {
    height: '148@vs',
    overflow: 'hidden',
    paddingLeft: '16@s',
  },
  scrollRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // ── Pill card ─────────────────────────────────────────────────────────────
  pill: {
    width: '150@s',
    height: '140@vs',
    marginRight: '10@s',
    borderRadius: '10@ms',
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowOpacity: 0.07,
    shadowRadius: 6,
    borderWidth: 1.3,
    borderColor: color.primary,
  },
  pillInner: {
    flex: 1,
    paddingHorizontal: '12@s',
    paddingBottom: '10@vs',
    paddingTop: '6@vs',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: '36@s',
    height: '36@s',
    borderRadius: '5@ms',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '8@vs',
  },
  pillValue: {
    fontSize: '20@ms',
    fontFamily: FONTS.Bold,
    lineHeight: '24@ms',
    marginTop: '4@vs',
  },
  pillLabel: {
    fontSize: '9@ms',
    fontFamily: FONTS.Bold,
    color: '#aaa',
    letterSpacing: 0.8,
    marginTop: '4@vs',
  },
  pillName: {
    fontSize: '13@ms',
    fontFamily: FONTS.Medium,
    color: '#333',
    lineHeight: '15@vs',
    flex: 1,
    marginTop: '6@vs',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: '5@ms',
    paddingHorizontal: '6@s',
    paddingVertical: '2@vs',
  },
  pillBadgeText: {
    fontSize: '9@ms',
    fontFamily: FONTS.Bold,
    letterSpacing: 0.3,
  },
})