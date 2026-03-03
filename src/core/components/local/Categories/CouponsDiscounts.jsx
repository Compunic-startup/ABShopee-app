import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  StatusBar,
  TextInput,
  RefreshControl,
  Clipboard,
  ToastAndroid,
  Dimensions,
  FlatList,
} from 'react-native'
import { ScaledSheet } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'

const { width } = Dimensions.get('window')

// ─── Config ───────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'all', label: 'All Offers', icon: 'tag-multiple' },
  { key: 'promotion', label: 'Promo', icon: 'ticket-percent' },
  { key: 'wholesale', label: 'Wholesale', icon: 'store' },
]

const CATEGORY_CONFIG = {
  promotion: { color: '#1565C0', bg: '#e7ebfb', gradientStart: '#4398ff', gradientEnd: '#1565C0', icon: 'fire', label: 'PROMO' },
  wholesale: { color: '#1565C0', bg: '#E3F2FD', gradientStart: '#42A5F5', gradientEnd: '#1565C0', icon: 'store-check', label: 'WHOLESALE' },
}

const TYPE_CONFIG = {
  percentage: { icon: 'percent', label: 'Percentage Off' },
  flat: { icon: 'currency-inr', label: 'Flat Discount' },
  bogo: { icon: 'gift-open', label: 'Buy 1 Get 1' },
  free_gift: { icon: 'gift', label: 'Free Gift' },
  free_shipping: { icon: 'truck-fast', label: 'Free Shipping' },
}

// ─── Conditional discount type config (no code) ───────────────────────────────
const CONDITIONAL_CONFIG = {
  bogo: {
    icon: 'gift-open-outline',
    color: '#7B1FA2',
    bg: '#F3E5F5',
    accentBg: '#7B1FA2',
    label: 'BUY 1 GET 1',
    tagline: 'Auto-applied at checkout',
  },
  free_gift: {
    icon: 'gift-outline',
    color: '#E65100',
    bg: '#FFF3E0',
    accentBg: '#E65100',
    label: 'FREE GIFT',
    tagline: 'Added automatically to your order',
  },
  free_shipping: {
    icon: 'truck-fast-outline',
    color: '#00695C',
    bg: '#E0F2F1',
    accentBg: '#00695C',
    label: 'FREE SHIPPING',
    tagline: 'Auto-applied when conditions are met',
  },
  percentage: {
    icon: 'percent-outline',
    color: '#1565C0',
    bg: '#E3F2FD',
    accentBg: '#1565C0',
    label: 'AUTO DISCOUNT',
    tagline: 'Discount applied automatically',
  },
  flat: {
    icon: 'tag-outline',
    color: '#2E7D32',
    bg: '#E8F5E9',
    accentBg: '#2E7D32',
    label: 'INSTANT SAVINGS',
    tagline: 'Discount applied automatically',
  },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatValue = (discountType, value) => {
  if (discountType === 'percentage') return `${parseFloat(value).toFixed(0)}%`
  if (discountType === 'flat') return `₹${parseFloat(value).toFixed(0)}`
  if (discountType === 'bogo') return 'B1G1'
  if (discountType === 'free_gift') return 'GIFT'
  if (discountType === 'free_shipping') return 'FREE'
  return value
}

const getExpiryInfo = endsAt => {
  if (!endsAt) return null
  const now = Date.now()
  const end = new Date(endsAt).getTime()
  const diff = end - now
  if (diff <= 0) return { expired: true, label: 'Expired' }
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 7) return { expired: false, label: `Ends ${new Date(endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`, urgent: false }
  if (days >= 1) return { expired: false, label: `${days}d ${hours}h left`, urgent: days <= 2 }
  const mins = Math.floor((diff % 3600000) / 60000)
  return { expired: false, label: `${hours}h ${mins}m left`, urgent: true }
}

// ─── Shimmer skeleton ─────────────────────────────────────────────────────────
function SkeletonCard() {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }, [])
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] })
  return (
    <Animated.View style={[styles.skeletonCard, { opacity }]}>
      <View style={styles.skeletonLeft} />
      <View style={styles.skeletonRight}>
        <View style={styles.skeletonLine1} />
        <View style={styles.skeletonLine2} />
        <View style={styles.skeletonLine3} />
      </View>
    </Animated.View>
  )
}

// ─── Conditional Discount Card (no code — auto-applied) ───────────────────────
function ConditionalDiscountCard({ item }) {
  const condConfig = CONDITIONAL_CONFIG[item.discountType] ?? CONDITIONAL_CONFIG.percentage
  const catConfig = CATEGORY_CONFIG[item.discountCategory] ?? CATEGORY_CONFIG.promotion
  const expiry = getExpiryInfo(item.endsAt)
  const valueDisplay = formatValue(item.discountType, item.value)
  const scaleAnim = useRef(new Animated.Value(1)).current

  const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start()
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()

  return (
    <Animated.View style={[conditionalStyles.card, { transform: [{ scale: scaleAnim }] }]}>
      {/* Left accent stripe */}
      <View style={[conditionalStyles.accentStripe, { backgroundColor: condConfig.accentBg }]} />

      <View style={conditionalStyles.body}>
        {/* Top: icon + value + name */}
        <View style={conditionalStyles.topRow}>
          <View style={[conditionalStyles.iconCircle, { backgroundColor: condConfig.bg }]}>
            <Icon name={condConfig.icon} size={24} color={condConfig.color} />
          </View>

          <View style={conditionalStyles.topMeta}>
            <View style={conditionalStyles.topMetaRow}>
              <Text style={conditionalStyles.discountName} numberOfLines={1}>{item.name}</Text>
              <View style={[conditionalStyles.typePill, { backgroundColor: condConfig.bg }]}>
                <Text style={[conditionalStyles.typePillText, { color: condConfig.color }]}>
                  {condConfig.label}
                </Text>
              </View>
            </View>

            {/* Value display for percentage/flat */}
            {(item.discountType === 'percentage' || item.discountType === 'flat') && (
              <Text style={[conditionalStyles.valueText, { color: condConfig.color }]}>
                {valueDisplay} OFF — {condConfig.tagline}
              </Text>
            )}
            {(item.discountType === 'bogo' || item.discountType === 'free_gift' || item.discountType === 'free_shipping') && (
              <Text style={[conditionalStyles.valueText, { color: condConfig.color }]}>
                {condConfig.tagline}
              </Text>
            )}
          </View>
        </View>

        {/* Description */}
        {item.description ? (
          <Text style={conditionalStyles.desc}>{item.description}</Text>
        ) : null}

        {/* Condition banner */}
        <View style={[conditionalStyles.conditionBanner, { borderColor: condConfig.color + '40', backgroundColor: condConfig.bg }]}>
          <Icon name="information-outline" size={14} color={condConfig.color} />
          <Text style={[conditionalStyles.conditionText, { color: condConfig.color }]}>
            {item.minAmount && parseFloat(item.minAmount) > 0
              ? `Add items worth ₹${parseFloat(item.minAmount).toFixed(0)} or more to unlock this offer`
              : 'Add eligible items to your cart — this discount applies automatically'}
          </Text>
        </View>

        {/* Footer chips */}
        <View style={conditionalStyles.footer}>
          <View style={conditionalStyles.autoChip}>
            <Icon name="lightning-bolt" size={11} color="#fff" />
            <Text style={conditionalStyles.autoChipText}>Auto-applied</Text>
          </View>

          {item.stackable && (
            <View style={[conditionalStyles.chip, { backgroundColor: '#E8F5E9', borderColor: '#A5D6A7' }]}>
              <Icon name="layers-triple" size={11} color="#2E7D32" />
              <Text style={[conditionalStyles.chipText, { color: '#2E7D32' }]}>Stackable</Text>
            </View>
          )}
          {item.exclusive && (
            <View style={[conditionalStyles.chip, { backgroundColor: '#E3F2FD', borderColor: '#90CAF9' }]}>
              <Icon name="crown" size={11} color="#1565C0" />
              <Text style={[conditionalStyles.chipText, { color: '#1565C0' }]}>Exclusive</Text>
            </View>
          )}

          {/* Expiry */}
          {expiry && !expiry.expired && (
            <View style={[conditionalStyles.chip, expiry.urgent
              ? { backgroundColor: '#FFF3E0', borderColor: '#FFCC80' }
              : { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' }
            ]}>
              <Icon name={expiry.urgent ? 'clock-alert' : 'clock-outline'} size={11} color={expiry.urgent ? '#E65100' : '#888'} />
              <Text style={[conditionalStyles.chipText, { color: expiry.urgent ? '#E65100' : '#888' }]}>{expiry.label}</Text>
            </View>
          )}
          {expiry?.expired && (
            <View style={[conditionalStyles.chip, { backgroundColor: '#EEEEEE', borderColor: '#E0E0E0' }]}>
              <Text style={[conditionalStyles.chipText, { color: '#aaa' }]}>Expired</Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  )
}

const conditionalStyles = ScaledSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: '16@ms',
    marginBottom: '14@vs',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  accentStripe: {
    width: '5@s',
    borderTopLeftRadius: '16@ms',
    borderBottomLeftRadius: '16@ms',
  },
  body: {
    flex: 1,
    padding: '14@s',
    gap: '10@vs',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '12@s',
  },
  iconCircle: {
    width: '48@s',
    height: '48@s',
    borderRadius: '14@ms',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  topMeta: {
    flex: 1,
  },
  topMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '8@s',
    flexWrap: 'wrap',
    marginBottom: '4@vs',
  },
  discountName: {
    fontSize: '15@ms',
    fontFamily: FONTS.Bold,
    color: '#1a1a1a',
    flex: 1,
  },
  typePill: {
    borderRadius: '5@ms',
    paddingHorizontal: '7@s',
    paddingVertical: '2@vs',
  },
  typePillText: {
    fontSize: '9@ms',
    fontFamily: FONTS.Bold,
    letterSpacing: 0.6,
  },
  valueText: {
    fontSize: '12@ms',
    fontFamily: FONTS.Medium,
    lineHeight: '16@vs',
  },
  desc: {
    fontSize: '12@ms',
    color: '#555',
    lineHeight: '18@vs',
    marginTop: '-2@vs',
  },
  conditionBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: '8@s',
    borderWidth: 1,
    borderRadius: '10@ms',
    padding: '10@s',
  },
  conditionText: {
    flex: 1,
    fontSize: '12@ms',
    fontFamily: FONTS.Medium,
    lineHeight: '17@vs',
  },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: '6@s',
    alignItems: 'center',
  },
  autoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    backgroundColor: '#2894c6',
    borderRadius: '20@ms',
    paddingHorizontal: '8@s',
    paddingVertical: '3@vs',
  },
  autoChipText: {
    fontSize: '10@ms',
    fontFamily: FONTS.Bold,
    color: '#fff',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4@s',
    borderRadius: '6@ms',
    borderWidth: 1,
    paddingHorizontal: '7@s',
    paddingVertical: '3@vs',
  },
  chipText: {
    fontSize: '10@ms',
    fontFamily: FONTS.Medium,
  },
})

// ─── Coupon Card (has code — manual) ─────────────────────────────────────────
function CouponCard({ item, onCopy, appliedCode }) {
  const catConfig = CATEGORY_CONFIG[item.discountCategory] ?? CATEGORY_CONFIG.promotion
  const expiry = getExpiryInfo(item.endsAt)
  const isApplied = appliedCode === item.code
  const scaleAnim = useRef(new Animated.Value(1)).current

  const pressIn = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()
  const pressOut = () => Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start()

  const valueDisplay = formatValue(item.discountType, item.value)

  return (
    <Animated.View style={[styles.couponCard, isApplied && styles.couponCardApplied, { transform: [{ scale: scaleAnim }] }]}>
      {/* Applied banner */}
      {isApplied && (
        <View style={styles.appliedBanner}>
          <Icon name="check-circle" size={12} color="#fff" />
          <Text style={styles.appliedBannerText}>APPLIED</Text>
        </View>
      )}

      {/* ── Top row ── */}
      <View style={styles.couponTop}>
        {/* Left: value pill */}
        <View style={[styles.valuePill, { backgroundColor: catConfig.bg }]}>
          <Text style={[styles.valuePillNumber, { color: catConfig.color }]}>{valueDisplay}</Text>
          {item.discountType === 'percentage' && (
            <Text style={[styles.valuePillOff, { color: catConfig.color }]}>OFF</Text>
          )}
        </View>

        {/* Middle: name + description */}
        <View style={styles.couponMeta}>
          <View style={styles.couponNameRow}>
            <Text style={styles.couponName} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.catPill, { backgroundColor: catConfig.bg }]}>
              <Icon name={catConfig.icon} size={10} color={catConfig.color} />
              <Text style={[styles.catPillText, { color: catConfig.color }]}>Code: </Text>
              <Text style={styles.couponCode} numberOfLines={1}>{item.code}</Text>
            </View>
          </View>
          <Text style={styles.couponDesc} numberOfLines={2}>{item.description}</Text>
        </View>
      </View>

      {/* ── Dashed divider ── */}
      <View style={styles.dashedDividerWrap}>
        <View style={[styles.notchLeft, isApplied && { backgroundColor: '#e8edf5' }]} />
        <View style={styles.dashedLine} />
        <View style={[styles.notchRight, isApplied && { backgroundColor: '#e8edf5' }]} />
      </View>

      {/* ── Bottom row ── */}
      <View style={styles.couponBottom}>
        {/* Conditions */}
        <View style={styles.conditionsRow}>
          {item.minAmount && parseFloat(item.minAmount) > 0 && (
            <View style={styles.conditionChip}>
              <Icon name="cart-check" size={11} color="#666" />
              <Text style={styles.conditionText}>Min ₹{parseFloat(item.minAmount).toFixed(0)}</Text>
            </View>
          )}
          {item.scopeType !== 'business' && (
            <View style={styles.conditionChip}>
              <Icon name="shape-outline" size={11} color="#666" />
              <Text style={styles.conditionText}>{item.scopeType}</Text>
            </View>
          )}
          {item.exclusive && (
            <View style={[styles.conditionChip, { backgroundColor: '#e0ecff' }]}>
              <Icon name="crown" size={11} color="#008ee6" />
              <Text style={[styles.conditionText, { color: '#0058e6' }]}>Exclusive</Text>
            </View>
          )}
          {item.stackable && (
            <View style={[styles.conditionChip, { backgroundColor: '#e8edf5' }]}>
              <Icon name="layers-triple" size={11} color="#2E7D32" />
              <Text style={[styles.conditionText, { color: '#2E7D32' }]}>Stackable</Text>
            </View>
          )}
        </View>

        {/* Right actions */}
        <View style={styles.couponActions}>
          {/* Expiry */}
          {expiry && !expiry.expired && (
            <View style={[styles.expiryChip, expiry.urgent && styles.expiryChipUrgent]}>
              <Icon name={expiry.urgent ? 'clock-alert' : 'clock-outline'} size={11} color={expiry.urgent ? '#2867c6' : '#666'} />
              <Text style={[styles.expiryText, expiry.urgent && styles.expiryTextUrgent]}>{expiry.label}</Text>
            </View>
          )}
          {expiry?.expired && (
            <View style={styles.expiryChipExpired}>
              <Text style={styles.expiryTextExpired}>Expired</Text>
            </View>
          )}

          {/* Copy button */}
          <TouchableOpacity
            style={[styles.copyBtn, isApplied && styles.copyBtnApplied]}
            onPress={() => onCopy(item.code)}
            activeOpacity={0.7}
          >
            <Icon name={isApplied ? 'check' : 'content-copy'} size={13} color={isApplied ? '#2E7D32' : '#0B77A7'} />
            <Text style={[styles.copyBtnText, isApplied && styles.copyBtnTextApplied]}>
              {isApplied ? 'Copied' : 'Copy'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function CouponDiscountScreen() {
  const navigation = useNavigation()
  const route = useRoute()

  const [discounts, setDiscounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [appliedCode, setAppliedCode] = useState(route?.params?.appliedCode ?? null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loadingMore, setLoadingMore] = useState(false)
  const [copiedCode, setCopiedCode] = useState(null)
  const [headerAnim] = useState(new Animated.Value(0))
  const tabIndicatorX = useRef(new Animated.Value(0)).current
  const tabWidth = (width - 32) / TABS.length

  useEffect(() => {
    fetchDiscounts(1, true)
  }, [activeTab])

  useEffect(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start()
  }, [])

  useEffect(() => {
    const idx = TABS.findIndex(t => t.key === activeTab)
    Animated.spring(tabIndicatorX, {
      toValue: idx * tabWidth,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start()
  }, [activeTab])

  const fetchDiscounts = async (pageNum = 1, reset = false) => {
    try {
      if (pageNum === 1) reset ? setLoading(true) : setRefreshing(true)
      else setLoadingMore(true)

      const token = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      const params = new URLSearchParams({ page: pageNum, limit: 20 })
      if (activeTab !== 'all') params.append('discountCategory', activeTab)

      const res = await fetch(
        `${BASE_URL}/customer/business/${businessId}/discounts?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const json = await res.json()
      console.log(json)

      if (json.success) {
        const list = json.data.discounts ?? []
        setDiscounts(prev => (reset || pageNum === 1) ? list : [...prev, ...list])
        setTotal(json.data.total ?? 0)
        setPage(pageNum)
      }
    } catch (err) {
      console.log('Fetch discounts error', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
      setLoadingMore(false)
    }
  }

  const onRefresh = () => fetchDiscounts(1, false)

  const handleLoadMore = () => {
    if (!loadingMore && discounts.length < total) {
      fetchDiscounts(page + 1)
    }
  }

  const handleCopy = useCallback(code => {
    Clipboard.setString(code)
    setCopiedCode(code)
    ToastAndroid.show(`"${code}" copied to clipboard!`, ToastAndroid.SHORT)
    setTimeout(() => setCopiedCode(null), 2500)
  }, [])

  const handleGoToCart = () => {
    navigation.navigate('CartScreen', { appliedCode })
  }

  // Filter by search
  const filtered = discounts.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Split: conditional (no code) vs coupon (has code)
  const conditionalDiscounts = filtered.filter(d => !d.code)
  const couponDiscounts = filtered.filter(d => !!d.code)

  const headerTranslateY = headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] })
  const headerOpacity = headerAnim

  // Combined render data with section separators
  const renderData = []
  if (conditionalDiscounts.length > 0) {
    renderData.push({ type: 'section', id: 'sec_auto', title: 'Auto-Applied Deals', subtitle: 'No code needed — these apply automatically', icon: 'lightning-bolt', count: conditionalDiscounts.length })
    conditionalDiscounts.forEach(d => renderData.push({ type: 'conditional', id: d.discountId, data: d }))
  }
  if (couponDiscounts.length > 0) {
    renderData.push({ type: 'section', id: 'sec_coupon', title: 'Coupon Codes', subtitle: 'Copy & apply at checkout', icon: 'ticket-confirmation-outline', count: couponDiscounts.length })
    couponDiscounts.forEach(d => renderData.push({ type: 'coupon', id: d.discountId, data: d }))
  }

  const renderItem = ({ item }) => {
    if (item.type === 'section') {
      return (
        <View style={styles.sectionSeparator}>
          <View style={styles.sectionSeparatorLeft}>
            <View style={styles.sectionIconWrap}>
              <Icon name={item.icon} size={14} color="#2894c6" />
            </View>
            <View>
              <Text style={styles.sectionSepTitle}>{item.title}</Text>
              <Text style={styles.sectionSepSubtitle}>{item.subtitle}</Text>
            </View>
          </View>
          <View style={styles.sectionCountPill}>
            <Text style={styles.sectionCountText}>{item.count}</Text>
          </View>
        </View>
      )
    }
    if (item.type === 'conditional') {
      return <ConditionalDiscountCard item={item.data} />
    }
    return (
      <CouponCard
        item={item.data}
        onCopy={handleCopy}
        appliedCode={appliedCode}
        copiedCode={copiedCode}
      />
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2894c6" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <Animated.View style={[styles.header, { opacity: headerOpacity, transform: [{ translateY: headerTranslateY }] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Coupons & Offers</Text>
          {total > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{total} available</Text>
            </View>
          )}
        </View>
        <TouchableOpacity style={styles.headerCartBtn} onPress={handleGoToCart}>
          <Icon name="cart-outline" size={24} color="#fff" />
          {appliedCode && <View style={styles.cartDot} />}
        </TouchableOpacity>
      </Animated.View>

      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Icon name="magnify" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search coupons or offers..."
            placeholderTextColor="#bbb"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={18} color="#bbb" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <View style={styles.tabsContainer}>
        <Animated.View
          style={[
            styles.tabIndicator,
            { width: tabWidth - 8, transform: [{ translateX: tabIndicatorX }] },
          ]}
        />
        {TABS.map(tab => {
          const isActive = activeTab === tab.key
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, { width: tabWidth }]}
              onPress={() => { setActiveTab(tab.key); setSearchQuery('') }}
              activeOpacity={0.75}
            >
              <Icon name={tab.icon} size={16} color={isActive ? '#2894c6' : '#888'} />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Applied Code Bar ───────────────────────────────────────────────── */}
      {appliedCode && (
        <View style={styles.appliedBar}>
          <View style={styles.appliedBarLeft}>
            <Icon name="ticket-confirmation" size={18} color="#2E7D32" />
            <View>
              <Text style={styles.appliedBarLabel}>Active Coupon</Text>
              <Text style={styles.appliedBarCode}>{appliedCode}</Text>
            </View>
          </View>
          <View style={styles.appliedBarRight}>
            <TouchableOpacity
              style={styles.goToCartBtn}
              onPress={handleGoToCart}
              activeOpacity={0.8}
            >
              <Text style={styles.goToCartBtnText}>Go to Cart</Text>
              <Icon name="arrow-right" size={14} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAppliedCode(null)} style={styles.removeAppliedBtn}>
              <Icon name="close" size={16} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.skeletonContainer} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </ScrollView>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconWrap}>
            <Icon name="ticket-outline" size={64} color="#cde8ff" />
          </View>
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No results found' : 'No coupons available'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `No coupons match "${searchQuery}"`
              : 'Check back later for exciting offers!'}
          </Text>
          {searchQuery ? (
            <TouchableOpacity style={styles.clearSearchBtn} onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchText}>Clear Search</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : (
        <FlatList
          data={renderData}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#2894c6']}
              tintColor="#2894c6"
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {filtered.length} offer{filtered.length !== 1 ? 's' : ''} for you
              </Text>
              <View style={styles.savingsTagWrap}>
                <Icon name="lightning-bolt" size={12} color="#fff" />
                <Text style={styles.savingsTagText}>Best Deals First</Text>
              </View>
            </View>
          }
          ListFooterComponent={
            loadingMore ? (
              <View style={styles.loadMoreIndicator}>
                <ActivityIndicator size="small" color="#2894c6" />
              </View>
            ) : null
          }
          renderItem={renderItem}
        />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = ScaledSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },

  // ── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: '16@s', paddingVertical: '14@vs',
    backgroundColor: '#2894c6',
    elevation: 6, shadowColor: '#2894c6',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8,
  },
  headerBackBtn: { padding: '4@s' },
  headerCenter: { flex: 1, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: '8@s' },
  headerTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff' },
  headerBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: '10@ms', paddingHorizontal: '8@s', paddingVertical: '2@vs',
  },
  headerBadgeText: { fontSize: '11@ms', color: '#fff', fontFamily: FONTS.Bold },
  headerCartBtn: { padding: '4@s', position: 'relative' },
  cartDot: {
    position: 'absolute', top: '2@vs', right: '2@s',
    width: '8@s', height: '8@s', borderRadius: '4@s',
    backgroundColor: '#FFD600', borderWidth: 1.5, borderColor: '#2894c6',
  },

  // ── Search ────────────────────────────────────────────────────────────────
  searchWrap: {
    backgroundColor: '#2894c6',
    paddingHorizontal: '16@s', paddingBottom: '14@vs', paddingTop: '4@vs',
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: '10@s',
    backgroundColor: '#fff', borderRadius: '12@ms',
    paddingHorizontal: '14@s', paddingVertical: '10@vs',
    elevation: 2,
  },
  searchInput: {
    flex: 1, fontSize: '14@ms', color: '#1a1a1a',
    fontFamily: FONTS.Medium, padding: 0,
  },

  // ── Tabs ──────────────────────────────────────────────────────────────────
  tabsContainer: {
    flexDirection: 'row', backgroundColor: '#fff',
    marginHorizontal: '16@s', marginTop: '12@vs', marginBottom: '4@vs',
    borderRadius: '14@ms', overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
    position: 'relative',
  },
  tabIndicator: {
    position: 'absolute', top: '4@vs', bottom: '4@vs', left: '4@s',
    backgroundColor: '#ebf3ff', borderRadius: '10@ms', zIndex: 0,
  },
  tab: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: '12@vs', gap: '6@s', zIndex: 1,
  },
  tabText: { fontSize: '13@ms', fontFamily: FONTS.Medium, color: '#888' },
  tabTextActive: { color: '#2894c6', fontFamily: FONTS.Bold },

  // ── Applied bar ───────────────────────────────────────────────────────────
  appliedBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: '16@s', marginTop: '8@vs', marginBottom: '4@vs',
    backgroundColor: '#e8edf5', borderRadius: '12@ms',
    paddingHorizontal: '14@s', paddingVertical: '10@vs',
    borderWidth: 1.5, borderColor: '#A5D6A7',
    elevation: 1,
  },
  appliedBarLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  appliedBarLabel: { fontSize: '11@ms', color: '#4CAF50', fontFamily: FONTS.Medium },
  appliedBarCode: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1B5E20', letterSpacing: 0.5 },
  appliedBarRight: { flexDirection: 'row', alignItems: 'center', gap: '8@s' },
  goToCartBtn: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    backgroundColor: '#2E7D32', borderRadius: '20@ms',
    paddingHorizontal: '12@s', paddingVertical: '6@vs',
  },
  goToCartBtnText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#fff' },
  removeAppliedBtn: { padding: '4@s' },

  // ── Section separator ─────────────────────────────────────────────────────
  sectionSeparator: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '12@vs', marginTop: '6@vs',
  },
  sectionSeparatorLeft: {
    flexDirection: 'row', alignItems: 'center', gap: '10@s',
  },
  sectionIconWrap: {
    width: '30@s', height: '30@s', borderRadius: '10@ms',
    backgroundColor: '#ebf3ff', justifyContent: 'center', alignItems: 'center',
  },
  sectionSepTitle: {
    fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#1a1a1a',
  },
  sectionSepSubtitle: {
    fontSize: '11@ms', color: '#999', fontFamily: FONTS.Medium, marginTop: '1@vs',
  },
  sectionCountPill: {
    backgroundColor: '#2894c6', borderRadius: '10@ms',
    paddingHorizontal: '9@s', paddingVertical: '3@vs',
  },
  sectionCountText: {
    fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#fff',
  },

  // ── List ──────────────────────────────────────────────────────────────────
  listContent: { paddingHorizontal: '16@s', paddingBottom: '24@vs', paddingTop: '8@vs' },
  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: '12@vs',
  },
  listHeaderText: { fontSize: '13@ms', color: '#888', fontFamily: FONTS.Medium },
  savingsTagWrap: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    backgroundColor: '#2894c6', borderRadius: '20@ms',
    paddingHorizontal: '10@s', paddingVertical: '4@vs',
  },
  savingsTagText: { fontSize: '11@ms', fontFamily: FONTS.Bold, color: '#fff' },
  loadMoreIndicator: { paddingVertical: '20@vs', alignItems: 'center' },

  // ── Coupon Card ───────────────────────────────────────────────────────────
  couponCard: {
    backgroundColor: '#fff', borderRadius: '16@ms',
    marginBottom: '14@vs', overflow: 'hidden',
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8,
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  couponCardApplied: {
    borderColor: '#A5D6A7', borderWidth: 2,
    backgroundColor: '#FAFFFE',
    elevation: 3, shadowColor: '#4CAF50',
  },
  appliedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: '5@s',
    backgroundColor: '#2E7D32', alignSelf: 'flex-start',
    borderBottomRightRadius: '8@ms',
    paddingHorizontal: '10@s', paddingVertical: '4@vs',
  },
  appliedBannerText: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: '#fff', letterSpacing: 0.8 },

  couponTop: {
    flexDirection: 'row', alignItems: 'flex-start', gap: '14@s',
    paddingHorizontal: '16@s', paddingTop: '16@vs', paddingBottom: '12@vs',
  },
  valuePill: {
    minWidth: '68@s', alignItems: 'center', justifyContent: 'center',
    borderRadius: '12@ms', paddingVertical: '10@vs', paddingHorizontal: '10@s',
    flexShrink: 0,
  },
  valuePillNumber: { fontSize: '22@ms', fontFamily: FONTS.Bold, lineHeight: '26@ms' },
  valuePillOff: { fontSize: '11@ms', fontFamily: FONTS.Bold, letterSpacing: 1, marginTop: '1@vs' },
  couponMeta: { flex: 1 },
  couponNameRow: { flexDirection: 'row', alignItems: 'center', gap: '8@s', marginBottom: '6@vs', flexWrap: 'wrap' },
  couponName: { fontSize: '15@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', letterSpacing: 0.3 },
  couponCode: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', letterSpacing: 0.5 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: '3@s',
    borderRadius: '4@ms', paddingHorizontal: '6@s', paddingVertical: '2@vs',
  },
  catPillText: { fontSize: '11@ms', fontFamily: FONTS.Bold, letterSpacing: 0.5 },
  couponDesc: { fontSize: '12@ms', color: '#666', lineHeight: '18@vs' },

  dashedDividerWrap: {
    flexDirection: 'row', alignItems: 'center', marginVertical: '4@vs',
  },
  notchLeft: {
    width: '16@s', height: '16@s', borderRadius: '8@s',
    backgroundColor: '#F5F5F5', marginLeft: '-8@s',
    borderWidth: 1, borderColor: '#F0F0F0',
  },
  dashedLine: {
    flex: 1, height: 1,
    borderWidth: 1, borderColor: '#E0E0E0', borderStyle: 'dashed',
  },
  notchRight: {
    width: '16@s', height: '16@s', borderRadius: '8@s',
    backgroundColor: '#F5F5F5', marginRight: '-8@s',
    borderWidth: 1, borderColor: '#F0F0F0',
  },

  couponBottom: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: '16@s', paddingTop: '8@vs', paddingBottom: '12@vs',
    flexWrap: 'wrap', gap: '6@s',
  },
  conditionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: '6@s', flex: 1 },
  conditionChip: {
    flexDirection: 'row', alignItems: 'center', gap: '3@s',
    backgroundColor: '#F5F5F5', borderRadius: '6@ms',
    paddingHorizontal: '7@s', paddingVertical: '3@vs',
  },
  conditionText: { fontSize: '10@ms', color: '#666', fontFamily: FONTS.Medium },
  couponActions: { flexDirection: 'row', alignItems: 'center', gap: '8@s' },
  expiryChip: {
    flexDirection: 'row', alignItems: 'center', gap: '3@s',
    backgroundColor: '#F5F5F5', borderRadius: '6@ms',
    paddingHorizontal: '7@s', paddingVertical: '3@vs',
  },
  expiryChipUrgent: { backgroundColor: '#FFEBEE' },
  expiryChipExpired: { backgroundColor: '#EEEEEE', borderRadius: '6@ms', paddingHorizontal: '7@s', paddingVertical: '3@vs' },
  expiryText: { fontSize: '10@ms', color: '#666', fontFamily: FONTS.Medium },
  expiryTextUrgent: { color: '#2894c6', fontFamily: FONTS.Bold },
  expiryTextExpired: { fontSize: '10@ms', color: '#aaa', fontFamily: FONTS.Medium },
  copyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: '4@s',
    borderWidth: 1.5, borderColor: '#0B77A7', borderRadius: '6@ms',
    paddingHorizontal: '8@s', paddingVertical: '3@vs', borderStyle: 'dashed',
  },
  copyBtnApplied: { borderColor: '#2E7D32', borderStyle: 'solid' },
  copyBtnText: { fontSize: '11@ms', fontFamily: FONTS.Bold, color: '#0B77A7' },
  copyBtnTextApplied: { color: '#2E7D32' },

  // ── Skeleton ──────────────────────────────────────────────────────────────
  skeletonContainer: { paddingHorizontal: '16@s', paddingTop: '12@vs' },
  skeletonCard: {
    backgroundColor: '#fff', borderRadius: '16@ms', padding: '16@s',
    marginBottom: '14@vs', flexDirection: 'row', gap: '14@s', elevation: 1,
  },
  skeletonLeft: { width: '68@s', height: '60@vs', borderRadius: '12@ms', backgroundColor: '#EEEEEE' },
  skeletonRight: { flex: 1, gap: '10@vs', justifyContent: 'center' },
  skeletonLine1: { height: '16@vs', backgroundColor: '#EEEEEE', borderRadius: '6@ms', width: '70%' },
  skeletonLine2: { height: '12@vs', backgroundColor: '#EEEEEE', borderRadius: '6@ms', width: '90%' },
  skeletonLine3: { height: '10@vs', backgroundColor: '#EEEEEE', borderRadius: '6@ms', width: '50%' },

  // ── Empty ─────────────────────────────────────────────────────────────────
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: '32@s' },
  emptyIconWrap: {
    width: '100@s', height: '100@s', borderRadius: '50@s',
    backgroundColor: '#FFF5F5', justifyContent: 'center', alignItems: 'center',
    marginBottom: '16@vs',
  },
  emptyTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#1a1a1a', marginBottom: '8@vs', textAlign: 'center' },
  emptySubtitle: { fontSize: '13@ms', color: '#999', textAlign: 'center', lineHeight: '20@vs', marginBottom: '20@vs' },
  clearSearchBtn: {
    backgroundColor: '#2894c6', borderRadius: '20@ms',
    paddingHorizontal: '24@s', paddingVertical: '10@vs',
  },
  clearSearchText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#fff' },
})