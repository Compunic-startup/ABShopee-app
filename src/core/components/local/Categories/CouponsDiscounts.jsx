import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Animated, StatusBar, TextInput, RefreshControl,
  Clipboard, ToastAndroid, Dimensions, FlatList, Platform,
} from 'react-native'
import { ScaledSheet, ms, vs, s } from 'react-native-size-matters'
import { useNavigation, useRoute } from '@react-navigation/native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'
import color from '../../../utils/color'

const { width } = Dimensions.get('window')

const TABS = [
  { key: 'all', label: 'All Offers', icon: 'tag-multiple' },
  { key: 'promotion', label: 'Promo', icon: 'ticket-percent' },
  { key: 'wholesale', label: 'Wholesale', icon: 'store' },
]

// ─── Helpers (unchanged) ─────────────────────────────────────────────────────
const formatValue = (discountType, value) => {
  if (discountType === 'percentage') return `${parseFloat(value).toFixed(0)}% OFF`
  if (discountType === 'flat') return `Save ₹${parseFloat(value).toFixed(0)}`
  if (discountType === 'bogo') return 'Buy 1 Get 1'
  if (discountType === 'free_gift') return 'Free Gift'
  if (discountType === 'free_shipping') return 'Free Delivery'
  return value
}
const formatValueShort = (discountType, value) => {
  if (discountType === 'percentage') return `${parseFloat(value).toFixed(0)}%`
  if (discountType === 'flat') return `₹${parseFloat(value).toFixed(0)}`
  if (discountType === 'bogo') return 'B1G1'
  if (discountType === 'free_gift') return 'GIFT'
  if (discountType === 'free_shipping') return 'FREE'
  return value
}
const getExpiryInfo = endsAt => {
  if (!endsAt) return null
  const diff = new Date(endsAt).getTime() - Date.now()
  if (diff <= 0) return { expired: true, label: 'Expired' }
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  if (days > 7) return { expired: false, label: `Valid till ${new Date(endsAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`, urgent: false }
  if (days >= 1) return { expired: false, label: `Ends in ${days}d`, urgent: days <= 2 }
  const mins = Math.floor((diff % 3600000) / 60000)
  return { expired: false, label: `${hours}h ${mins}m left!`, urgent: true }
}

const CONDITIONAL_CONFIG = {
  bogo: { icon: 'gift-open-outline', humanLabel: 'Buy one, get one free' },
  free_gift: { icon: 'gift-outline', humanLabel: 'Free gift with your order' },
  free_shipping: { icon: 'truck-fast-outline', humanLabel: 'Free delivery on this order' },
  percentage: { icon: 'percent-outline', humanLabel: 'Automatic percentage discount' },
  flat: { icon: 'tag-outline', humanLabel: 'Fixed rupee discount' },
}


// ─── Skeleton (unchanged) ─────────────────────────────────────────────────────
function SkeletonCard() {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
    ])).start()
  }, [])
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] })
  return (
    <Animated.View style={[S.skeletonCard, { opacity }]}>
      <View style={S.skeletonLeft} />
      <View style={S.skeletonRight}>
        <View style={S.skeletonLine1} />
        <View style={S.skeletonLine2} />
        <View style={S.skeletonLine3} />
      </View>
    </Animated.View>
  )
}

// ─── Auto-deal card ───────────────────────────────────────────────────────────
function ConditionalDiscountCard({ item }) {
  const cfg = CONDITIONAL_CONFIG[item.discountType] ?? CONDITIONAL_CONFIG.percentage
  const expiry = getExpiryInfo(item.endsAt)
  const valueLine =
    item.discountType === 'percentage' ? `${parseFloat(item.value).toFixed(0)}% off on your order` :
      item.discountType === 'flat' ? `₹${parseFloat(item.value).toFixed(0)} off on your order` :
        cfg.humanLabel

  return (
    <View style={S.autoCard}>
      <View style={S.autoBar} />
      <View style={S.autoBody}>
        <View style={S.autoTopRow}>
          <View style={S.autoIconBox}>
            <Icon name={cfg.icon} size={ms(20)} color={color.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.autoName} numberOfLines={2}>{item.name}</Text>
            <Text style={S.autoValue}>{valueLine}</Text>
          </View>
          <View style={S.autoPill}>
            <Icon name="lightning-bolt" size={ms(9)} color="#fff" />
            <Text style={S.autoPillText}>AUTO</Text>
          </View>
        </View>

        {/* {!!item.description && <Text style={S.autoDesc} numberOfLines={2}>{item.description}</Text>} */}

        <View style={S.autoStrip}>
          <Icon name="information-outline" size={ms(13)} color={color.primary} />
          <Text style={S.autoStripText}>
            {item.minAmount && parseFloat(item.minAmount) > 0
              ? `Shop for ₹${parseFloat(item.minAmount).toFixed(0)} or more to unlock this discount automatically`
              : 'Add eligible items — discount applied automatically, no coupon needed'}
          </Text>
        </View>

        <View style={S.chipRow}>
          {item.stackable && <View style={S.chip}><Icon name="layers-triple" size={ms(10)} color={color.primary} /><Text style={S.chipText}>Stackable</Text></View>}
          {item.exclusive && <View style={S.chip}><Icon name="crown" size={ms(10)} color={color.primary} /><Text style={S.chipText}>Exclusive</Text></View>}
          {expiry && !expiry.expired && (
            <View style={[S.chip, expiry.urgent && S.chipUrgent]}>
              <Icon name={expiry.urgent ? 'clock-alert' : 'clock-outline'} size={ms(10)} color={expiry.urgent ? '#C62828' : '#888'} />
              <Text style={[S.chipText, expiry.urgent && { color: '#C62828', fontFamily: FONTS.Bold }]}>{expiry.label}</Text>
            </View>
          )}
          {expiry?.expired && <View style={[S.chip, S.chipExpired]}><Text style={S.chipExpiredText}>Expired</Text></View>}
        </View>
      </View>
    </View>
  )
}

// ─── Coupon card — Flipkart dashed style ──────────────────────────────────────
function CouponCard({ item, onCopy, appliedCode }) {
  const expiry = getExpiryInfo(item.endsAt)
  const isApplied = appliedCode === item.code
  const shortValue = formatValueShort(item.discountType, item.value)
  const humanValue = formatValue(item.discountType, item.value)

  return (
    <View style={[S.couponCard, isApplied && S.couponCardApplied]}>
      {isApplied && (
        <View style={S.appliedBanner}>
          <Icon name="check-circle" size={ms(11)} color="#fff" />
          <Text style={S.appliedBannerText}>COUPON APPLIED ✓</Text>
        </View>
      )}

      {/* Top */}
      <View style={S.couponTop}>
        <View style={S.couponValueBox}>
          <Text style={S.couponValueNum}>{shortValue}</Text>
          {item.discountType === 'percentage' && <Text style={S.couponValueOff}>OFF</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={S.couponName} numberOfLines={1}>{item.name}</Text>
          <Text style={S.couponSavings}>{humanValue}</Text>
          {!!item.description && <Text style={S.couponDesc} numberOfLines={2}>{item.description}</Text>}
          {/* Dashed code box */}
          <View style={S.codeBox}>
            <Text style={S.codeText}>{item.code}</Text>
          </View>
        </View>
      </View>

      {/* Dashed separator with notches */}
      <View style={S.dashedRow}>
        <View style={S.notchL} />
        <View style={S.dashedLine} />
        <View style={S.notchR} />
      </View>

      {/* Bottom */}
      <View style={S.couponBottom}>
        <View style={S.chipRow}>
          {item.minAmount && parseFloat(item.minAmount) > 0 && (
            <View style={S.chip}><Icon name="cart-check" size={ms(10)} color="#888" /><Text style={S.chipText}>Min ₹{parseFloat(item.minAmount).toFixed(0)}</Text></View>
          )}
          {item.scopeType && item.scopeType !== 'business' && (
            <View style={S.chip}><Icon name="shape-outline" size={ms(10)} color="#888" /><Text style={S.chipText}>{item.scopeType}</Text></View>
          )}
          {item.exclusive && <View style={[S.chip, S.chipHL]}><Icon name="crown" size={ms(10)} color={color.primary} /><Text style={[S.chipText, { color: color.primary }]}>Exclusive</Text></View>}
          {item.stackable && <View style={[S.chip, S.chipHL]}><Icon name="layers-triple" size={ms(10)} color={color.primary} /><Text style={[S.chipText, { color: color.primary }]}>Stackable</Text></View>}
          {expiry && !expiry.expired && (
            <View style={[S.chip, expiry.urgent && S.chipUrgent]}>
              <Icon name={expiry.urgent ? 'clock-alert' : 'clock-outline'} size={ms(10)} color={expiry.urgent ? '#C62828' : '#888'} />
              <Text style={[S.chipText, expiry.urgent && { color: '#C62828', fontFamily: FONTS.Bold }]}>{expiry.label}</Text>
            </View>
          )}
          {expiry?.expired && <View style={[S.chip, S.chipExpired]}><Text style={S.chipExpiredText}>Expired</Text></View>}
        </View>

        <TouchableOpacity
          style={[S.copyBtn, isApplied && S.copyBtnApplied]}
          onPress={() => onCopy(item.code)}
          activeOpacity={0.75}
        >
          <Icon name={isApplied ? 'check' : 'content-copy'} size={ms(13)} color="#fff" />
          <Text style={S.copyBtnText}>{isApplied ? 'Copied!' : 'Copy Code'}</Text>
        </TouchableOpacity>
      </View>
    </View>
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

  const tabWidth = (width - 32) / TABS.length
  const tabIndicatorX = useRef(new Animated.Value(0)).current

  useEffect(() => { fetchDiscounts(1, true) }, [activeTab])

  useEffect(() => {
    const idx = TABS.findIndex(t => t.key === activeTab)
    Animated.spring(tabIndicatorX, { toValue: idx * tabWidth, useNativeDriver: true, tension: 60, friction: 10 }).start()
  }, [activeTab])

  // ── All fetch logic unchanged ──────────────────────────────────────────────
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
      if (json.success) {
        const list = json.data.discounts ?? []
        setDiscounts(prev => (reset || pageNum === 1) ? list : [...prev, ...list])
        setTotal(json.data.total ?? 0)
        setPage(pageNum)
      }
    } catch (err) { console.log('Fetch discounts error', err) }
    finally { setLoading(false); setRefreshing(false); setLoadingMore(false) }
  }

  const onRefresh = () => fetchDiscounts(1, false)
  const handleLoadMore = () => { if (!loadingMore && discounts.length < total) fetchDiscounts(page + 1) }

  const handleCopy = useCallback(code => {
    Clipboard.setString(code)
    setCopiedCode(code)
    ToastAndroid.show(`"${code}" copied! Apply at checkout.`, ToastAndroid.SHORT)
    setTimeout(() => setCopiedCode(null), 2500)
  }, [])

  const handleGoToCart = () => navigation.navigate('CartScreen', { appliedCode })

  const filtered = discounts.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.code ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const conditionalDiscounts = filtered.filter(d => !d.code)
  const couponDiscounts = filtered.filter(d => !!d.code)

  const renderData = []
  if (conditionalDiscounts.length > 0) {
    renderData.push({ type: 'section', id: 'sec_auto', title: 'Auto Deals', subtitle: 'Applied automatically — no code needed', icon: 'lightning-bolt', count: conditionalDiscounts.length })
    conditionalDiscounts.forEach(d => renderData.push({ type: 'conditional', id: d.discountId, data: d }))
  }
  if (couponDiscounts.length > 0) {
    renderData.push({ type: 'section', id: 'sec_coupon', title: 'Coupon Codes', subtitle: 'Copy code & apply at checkout', icon: 'ticket-confirmation-outline', count: couponDiscounts.length })
    couponDiscounts.forEach(d => renderData.push({ type: 'coupon', id: d.discountId, data: d }))
  }

  const shouldScroll = renderData.length > 3

  const renderItem = ({ item }) => {
    if (item.type === 'section') return (
      <View style={S.sectionHead}>
        <View style={S.sectionHeadLeft}>
          <View style={S.sectionIconBox}>
            <Icon name={item.icon} size={ms(13)} color={color.primary} />
          </View>
          <View>
            <Text style={S.sectionTitle}>{item.title}</Text>
            <Text style={S.sectionSub}>{item.subtitle}</Text>
          </View>
        </View>
        <View style={S.sectionCountPill}>
          <Text style={S.sectionCountText}>{item.count}</Text>
        </View>
      </View>
    )
    if (item.type === 'conditional') return <ConditionalDiscountCard item={item.data} />
    return <CouponCard item={item.data} onCopy={handleCopy} appliedCode={appliedCode} copiedCode={copiedCode} />
  }

  return (
    <View style={S.container}>
      <StatusBar barStyle="light-content" backgroundColor={color.primary} />

      {/* ── Header ── */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.headerBtn}>
          <Icon name="arrow-left" size={ms(22)} color="#fff" />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Coupons & Offers</Text>
        <TouchableOpacity onPress={handleGoToCart} style={S.headerBtn}>
          <Icon name="cart-outline" size={ms(22)} color="#fff" />
          {appliedCode && <View style={S.cartDot} />}
        </TouchableOpacity>
      </View>

      {/* ── Search (continues primary strip) ── */}
      <View style={S.searchStrip}>
        <View style={S.searchBar}>
          <Icon name="magnify" size={ms(17)} color="#999" />
          <TextInput
            style={S.searchInput}
            placeholder="Search offers or coupon code…"
            placeholderTextColor="#BDBDBD"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="characters"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={ms(16)} color="#BDBDBD" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={S.tabBar}>
        <Animated.View style={[S.tabIndicator, { width: tabWidth - 8, transform: [{ translateX: tabIndicatorX }] }]} />
        {TABS.map(tab => {
          const active = activeTab === tab.key
          return (
            <TouchableOpacity
              key={tab.key}
              style={[S.tab, { width: tabWidth }]}
              onPress={() => { setActiveTab(tab.key); setSearchQuery('') }}
              activeOpacity={0.75}
            >
              <Icon name={tab.icon} size={ms(13)} color={active ? color.primary : '#888'} />
              <Text style={[S.tabText, active && S.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Applied bar ── */}
      {appliedCode && (
        <View style={S.appliedBar}>
          <View style={S.appliedBarL}>
            <Icon name="ticket-confirmation" size={ms(15)} color={color.primary} />
            <View>
              <Text style={S.appliedBarLabel}>Coupon active</Text>
              <Text style={S.appliedBarCode}>{appliedCode}</Text>
            </View>
          </View>
          <View style={S.appliedBarR}>
            <TouchableOpacity style={S.goCartBtn} onPress={handleGoToCart} activeOpacity={0.8}>
              <Text style={S.goCartText}>Go to Cart</Text>
              <Icon name="arrow-right" size={ms(13)} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAppliedCode(null)} style={{ padding: s(4) }}>
              <Icon name="close" size={ms(15)} color="#999" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Body ── */}
      {loading ? (
        <ScrollView contentContainerStyle={S.skeletonWrap} showsVerticalScrollIndicator={false}>
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </ScrollView>
      ) : filtered.length === 0 ? (
        <View style={S.emptyWrap}>
          <View style={S.emptyIconBox}>
            <Icon name="ticket-outline" size={ms(44)} color={color.primary} />
          </View>
          <Text style={S.emptyTitle}>{searchQuery ? 'No matching offers' : 'No offers right now'}</Text>
          <Text style={S.emptySubtitle}>
            {searchQuery
              ? `Nothing matched "${searchQuery}". Try a different search.`
              : 'Check back later — new deals are added regularly!'}
          </Text>
          {!!searchQuery && (
            <TouchableOpacity style={S.clearBtn} onPress={() => setSearchQuery('')}>
              <Text style={S.clearBtnText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={renderData}
          keyExtractor={item => item.id}
          contentContainerStyle={S.listContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={shouldScroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[color.primary]} tintColor={color.primary} />}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            <View style={S.listHeader}>
              <Text style={S.listHeaderText}>
                {filtered.length} offer{filtered.length !== 1 ? 's' : ''} for you
              </Text>
              <View style={S.bestPill}>
                <Icon name="lightning-bolt" size={ms(10)} color="#fff" />
                <Text style={S.bestPillText}>Best Deals First</Text>
              </View>
            </View>
          }
          ListFooterComponent={
            loadingMore
              ? <View style={{ paddingVertical: vs(20), alignItems: 'center' }}>
                <ActivityIndicator size="small" color={color.primary} />
              </View>
              : null
          }
          renderItem={renderItem}
        />
      )}
    </View>
  )
}

// ─── Styles — ONLY color.* ────────────────────────────────────────────────────
const S = ScaledSheet.create({
  container: { flex: 1, backgroundColor: color.background },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: color.primary,
    paddingTop: Platform.OS === 'android' ? '14@vs' : '52@vs',
    paddingBottom: '13@vs', paddingHorizontal: '14@s',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
  },
  headerBtn: { width: '36@s', height: '36@s', borderRadius: '18@ms', justifyContent: 'center', alignItems: 'center', position: 'relative' },
  headerTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: '#fff' },
  cartDot: { position: 'absolute', top: '2@vs', right: '2@s', width: '8@s', height: '8@s', borderRadius: '4@ms', backgroundColor: color.secondary, borderWidth: 1.5, borderColor: color.primary },

  // Search strip
  searchStrip: { backgroundColor: color.primary, paddingHorizontal: '14@s', paddingBottom: '14@vs', paddingTop: '4@vs' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: '8@s', backgroundColor: '#fff', borderRadius: '8@ms', paddingHorizontal: '12@s', paddingVertical: '9@vs' },
  searchInput: { flex: 1, fontSize: '14@ms', color: color.text, fontFamily: FONTS.Medium, padding: 0 },

  // Tabs
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EBEBEB', position: 'relative' },
  tabIndicator: { position: 'absolute', bottom: 0, left: '4@s', height: '2@vs', backgroundColor: color.primary, borderRadius: '2@ms', zIndex: 1 },
  tab: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: '12@vs', gap: '5@s' },
  tabText: { fontSize: '13@ms', fontFamily: FONTS.Medium, color: '#888' },
  tabTextActive: { color: color.primary, fontFamily: FONTS.Bold },

  // Applied bar
  appliedBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: color.primary+20, paddingHorizontal: '14@s', paddingVertical: '10@vs', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  appliedBarL: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  appliedBarLabel: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium },
  appliedBarCode: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.primary },
  appliedBarR: { flexDirection: 'row', alignItems: 'center', gap: '8@s' },
  goCartBtn: { flexDirection: 'row', alignItems: 'center', gap: '4@s', backgroundColor: color.primary, borderRadius: '20@ms', paddingHorizontal: '12@s', paddingVertical: '6@vs' },
  goCartText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // Section header
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10@vs', marginTop: '8@vs' },
  sectionHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: '10@s' },
  sectionIconBox: { width: '28@s', height: '28@s', borderRadius: '8@ms', backgroundColor: color.primary+20, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text },
  sectionSub: { fontSize: '11@ms', color: '#888', fontFamily: FONTS.Medium, marginTop: '1@vs' },
  sectionCountPill: { backgroundColor: color.primary, borderRadius: '10@ms', paddingHorizontal: '9@s', paddingVertical: '3@vs' },
  sectionCountText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // List
  listContent: { paddingHorizontal: '14@s', paddingBottom: '24@vs', paddingTop: '10@vs' },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12@vs' },
  listHeaderText: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium },
  bestPill: { flexDirection: 'row', alignItems: 'center', gap: '4@s', backgroundColor: color.primary, borderRadius: '20@ms', paddingHorizontal: '10@s', paddingVertical: '4@vs' },
  bestPillText: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // Shared chips
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: '6@s', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: '3@s', backgroundColor: color.background, borderRadius: '4@ms', paddingHorizontal: '7@s', paddingVertical: '3@vs', borderWidth: 1, borderColor: '#E0E0E0' },
  chipHL: { backgroundColor: color.primary+20, borderColor: color.primary },
  chipUrgent: { backgroundColor: '#FFEBEE', borderColor: '#FFCDD2' },
  chipExpired: { backgroundColor: '#F5F5F5', borderColor: '#E0E0E0' },
  chipText: { fontSize: '10@ms', color: '#888', fontFamily: FONTS.Medium },
  chipExpiredText: { fontSize: '10@ms', color: '#BDBDBD', fontFamily: FONTS.Medium },

  // Auto card
  autoCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: '8@ms', marginBottom: '10@vs', overflow: 'hidden', borderWidth: 1, borderColor: '#EBEBEB', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  autoBar: { width: '4@s', backgroundColor: color.primary },
  autoBody: { flex: 1, padding: '12@s', gap: '8@vs' },
  autoTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: '10@s' },
  autoIconBox: { width: '40@s', height: '40@s', borderRadius: '8@ms', backgroundColor: color.primary+20, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  autoName: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '3@vs' },
  autoValue: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.primary },
  autoPill: { flexDirection: 'row', alignItems: 'center', gap: '3@s', backgroundColor: color.primary, borderRadius: '4@ms', paddingHorizontal: '6@s', paddingVertical: '2@vs' },
  autoPillText: { fontSize: '9@ms', fontFamily: FONTS.Bold, color: '#fff', letterSpacing: 0.5 },
  autoDesc: { fontSize: '12@ms', color: '#888', fontFamily: FONTS.Medium, lineHeight: '17@ms' },
  autoStrip: { flexDirection: 'row', alignItems: 'flex-start', gap: '6@s', backgroundColor: color.primary+20, borderRadius: '6@ms', padding: '8@s' },
  autoStripText: { flex: 1, fontSize: '11@ms', color: color.text, fontFamily: FONTS.Medium, lineHeight: '16@ms' },

  // Coupon card
  couponCard: { backgroundColor: '#fff', borderRadius: '8@ms', marginBottom: '10@vs', overflow: 'hidden', borderWidth: 1, borderColor: '#EBEBEB', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  couponCardApplied: { borderColor: color.primary, borderWidth: 1.5, backgroundColor: color.primary+20 },
  appliedBanner: { flexDirection: 'row', alignItems: 'center', gap: '5@s', backgroundColor: color.primary, alignSelf: 'flex-start', borderBottomRightRadius: '6@ms', paddingHorizontal: '10@s', paddingVertical: '4@vs' },
  appliedBannerText: { fontSize: '9@ms', fontFamily: FONTS.Bold, color: '#fff', letterSpacing: 0.8 },

  couponTop: { flexDirection: 'row', alignItems: 'flex-start', gap: '12@s', paddingHorizontal: '14@s', paddingTop: '14@vs', paddingBottom: '10@vs' },
  couponValueBox: { width: '64@s', minHeight: '64@s', backgroundColor: color.primary+20, borderRadius: '8@ms', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderWidth: 1, borderColor: '#E0E0E0' },
  couponValueNum: { fontSize: '20@ms', fontFamily: FONTS.Bold, color: color.primary, lineHeight: '24@ms' },
  couponValueOff: { fontSize: '10@ms', fontFamily: FONTS.Bold, color: color.primary, letterSpacing: 1 },
  couponName: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '3@vs' },
  couponSavings: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: color.primary, marginBottom: '4@vs' },
  couponDesc: { fontSize: '11@ms', color: '#888', lineHeight: '16@ms', marginBottom: '6@vs' },
  codeBox: { alignSelf: 'flex-start', borderWidth: 1.5, borderColor: color.primary, borderStyle: 'dashed', borderRadius: '4@ms', paddingHorizontal: '10@s', paddingVertical: '4@vs' },
  codeText: { fontSize: '13@ms', fontFamily: FONTS.Bold, color: color.primary, letterSpacing: 1.5 },

  dashedRow: { flexDirection: 'row', alignItems: 'center' },
  notchL: { width: '14@s', height: '14@s', borderRadius: '7@ms', backgroundColor: color.background, marginLeft: '-7@s', borderWidth: 1, borderColor: '#EBEBEB' },
  dashedLine: { flex: 1, height: 1, borderWidth: 1, borderColor: '#E0E0E0', borderStyle: 'dashed' },
  notchR: { width: '14@s', height: '14@s', borderRadius: '7@ms', backgroundColor: color.background, marginRight: '-7@s', borderWidth: 1, borderColor: '#EBEBEB' },

  couponBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: '14@s', paddingTop: '8@vs', paddingBottom: '12@vs', flexWrap: 'wrap', gap: '6@s' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: '5@s', backgroundColor: color.primary, borderRadius: '6@ms', paddingHorizontal: '12@s', paddingVertical: '8@vs' },
  copyBtnApplied: { backgroundColor: '#2E7D32' },
  copyBtnText: { fontSize: '12@ms', fontFamily: FONTS.Bold, color: '#fff' },

  // Skeleton
  skeletonWrap: { paddingHorizontal: '14@s', paddingTop: '12@vs' },
  skeletonCard: { backgroundColor: '#fff', borderRadius: '8@ms', padding: '16@s', marginBottom: '10@vs', flexDirection: 'row', gap: '14@s', elevation: 1 },
  skeletonLeft: { width: '64@s', height: '60@vs', borderRadius: '8@ms', backgroundColor: color.primary+20 },
  skeletonRight: { flex: 1, gap: '10@vs', justifyContent: 'center' },
  skeletonLine1: { height: '14@vs', backgroundColor: color.primary+20, borderRadius: '4@ms', width: '70%' },
  skeletonLine2: { height: '11@vs', backgroundColor: color.primary+20, borderRadius: '4@ms', width: '90%' },
  skeletonLine3: { height: '10@vs', backgroundColor: color.primary+20, borderRadius: '4@ms', width: '45%' },

  // Empty
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: '32@s' },
  emptyIconBox: { width: '88@s', height: '88@s', borderRadius: '44@ms', backgroundColor: color.primary+20, justifyContent: 'center', alignItems: 'center', marginBottom: '16@vs', borderWidth: 1, borderColor: '#EEE' },
  emptyTitle: { fontSize: '18@ms', fontFamily: FONTS.Bold, color: color.text, marginBottom: '8@vs', textAlign: 'center' },
  emptySubtitle: { fontSize: '13@ms', color: '#888', textAlign: 'center', lineHeight: '20@ms', marginBottom: '20@vs' },
  clearBtn: { backgroundColor: color.primary, borderRadius: '6@ms', paddingHorizontal: '24@s', paddingVertical: '10@vs' },
  clearBtnText: { fontSize: '14@ms', fontFamily: FONTS.Bold, color: '#fff' },
})