import React, { useCallback, useRef, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  StyleSheet,
  Platform,
  Animated,
} from 'react-native'
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import FONTS from '../../../utils/fonts'
import BASE_URL from '../../../services/api'

/* ─── palette ─── */
const BLUE       = '#0B77A7'
const BLUE_DARK  = '#085f87'
const BLUE_LIGHT = '#E8F4FB'
const BLUE_MID   = '#C2E0F0'
const WHITE      = '#FFFFFF'
const BG         = '#F4F9FC'
const TEXT_DARK  = '#0D1B2A'
const TEXT_MID   = '#4A6070'
const TEXT_LIGHT = '#8FA8B8'
const BORDER     = '#DCE8F0'

/* ─── helpers ─── */
const getStatusConfig = status => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'success':
      return { color: '#1E8C45', bg: '#E8F5EE', icon: 'check-circle-outline',   label: 'Completed'  }
    case 'processing':
      return { color: BLUE,      bg: BLUE_LIGHT, icon: 'progress-clock',         label: 'Processing' }
    case 'pending':
      return { color: '#E65100', bg: '#FFF3E0', icon: 'clock-outline',           label: 'Pending'    }
    case 'failed':
      return { color: '#C62828', bg: '#FFEBEE', icon: 'close-circle-outline',    label: 'Failed'     }
    case 'cancelled':
      return { color: '#6A1B9A', bg: '#F3E5F5', icon: 'cancel',                  label: 'Cancelled'  }
    default:
      return { color: TEXT_MID,  bg: BG,        icon: 'help-circle-outline',     label: status       }
  }
}

const getProviderIcon = provider => {
  switch (provider?.toLowerCase()) {
    case 'razorpay': return 'lightning-bolt'
    case 'upi':      return 'cellphone'
    case 'cod':      return 'cash'
    case 'wallet':   return 'wallet-outline'
    default:         return 'credit-card-outline'
  }
}

const fmt = (amount, currency = 'INR') =>
  `${currency === 'INR' ? '₹' : currency}${parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`

const fmtDate = iso =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

const fmtTime = iso =>
  new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

/* ─── filters ─── */
const FILTERS = [
  { key: 'all',        label: 'All',        icon: 'view-list'         },
  { key: 'processing', label: 'Processing', icon: 'progress-clock'    },
  { key: 'completed',  label: 'Completed',  icon: 'check-circle-outline' },
  { key: 'pending',    label: 'Pending',    icon: 'clock-outline'     },
]

/* ═══════════════════════════════════════════════════ */
/*  Refund Card                                        */
/* ═══════════════════════════════════════════════════ */
function RefundCard({ item, listAnim }) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const onIn  = () => Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start()
  const onOut = () => Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start()

  const statusCfg = getStatusConfig(item.status)

  const items      = item.orderPreview?.items || []
  const financials = item.orderPreview?.financials || {}
  const payment    = item.initialPayment || {}
  const firstItem  = items[0]
  const extraCount = items.length - 1

  /* refund progress bar (refunded / totalPaid) */
  const totalPaid    = parseFloat(financials.totalPaid    || 0)
  const totalRefunded = parseFloat(financials.totalRefunded || 0)
  const progress     = totalPaid > 0 ? Math.min(totalRefunded / totalPaid, 1) : 0
  const isFullRefund = financials.refundableRemaining === 0

  return (
    <Animated.View
      style={{
        opacity: listAnim,
        transform: [
          { scale: scaleAnim },
          { translateY: listAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
        ],
      }}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onIn}
        onPressOut={onOut}
        style={styles.card}
      >
        {/* ── top row ── */}
        <View style={styles.cardTop}>
          <View style={[styles.typeIconWrap, { backgroundColor: statusCfg.bg }]}>
            <Icon name="cash-refund" size={22} color={statusCfg.color} />
          </View>

          <View style={styles.cardTopMid}>
            <Text style={styles.amountText}>{fmt(item.amount, item.currency)}</Text>
            <View style={styles.providerRow}>
              <Icon name={getProviderIcon(item.provider)} size={12} color={TEXT_LIGHT} />
              <Text style={styles.providerText}>{item.provider}</Text>
              {payment.method && (
                <>
                  <Text style={styles.dot}>·</Text>
                  <Text style={styles.providerText}>{payment.method}</Text>
                </>
              )}
            </View>
          </View>

          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Icon name={statusCfg.icon} size={12} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* ── refund progress ── */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Refund Progress</Text>
            <Text style={styles.progressValue}>
              {fmt(totalRefunded)} / {fmt(totalPaid)}
              {isFullRefund && (
                <Text style={styles.fullRefundBadge}> FULL</Text>
              )}
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: statusCfg.color }]} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* ── order items preview ── */}
        {firstItem && (
          <View style={styles.itemsPreview}>
            <Icon name="shopping-outline" size={13} color={TEXT_LIGHT} />
            <Text style={styles.itemsText} numberOfLines={1}>
              {firstItem.title}
              {extraCount > 0 && (
                <Text style={styles.itemsExtra}> +{extraCount} more item{extraCount > 1 ? 's' : ''}</Text>
              )}
            </Text>
          </View>
        )}

        {/* ── payment ref ── */}
        {payment.providerPaymentId && (
          <View style={styles.refRow}>
            <Icon name="identifier" size={12} color={TEXT_LIGHT} />
            <Text style={styles.refText} numberOfLines={1}>Ref: {payment.providerPaymentId}</Text>
          </View>
        )}

        {/* ── reason ── */}
        {item.reason && (
          <View style={styles.reasonRow}>
            <Icon name="information-outline" size={12} color={TEXT_LIGHT} />
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>
        )}

        <View style={styles.divider} />

        {/* ── bottom ── */}
        <View style={styles.cardBottom}>
          <View style={styles.cardBottomLeft}>
            <Icon name="receipt-text-outline" size={12} color={TEXT_LIGHT} />
            <Text style={styles.orderIdText}>{item.orderId?.slice(0, 8)}…</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <Icon name="calendar-outline" size={12} color={TEXT_LIGHT} />
            <Text style={styles.dateText}>{fmtDate(item.createdAt)}</Text>
            <Text style={styles.dot}>·</Text>
            <Icon name="clock-outline" size={12} color={TEXT_LIGHT} />
            <Text style={styles.dateText}>{fmtTime(item.createdAt)}</Text>
          </View>
        </View>

        {/* completed-at row */}
        {item.completedAt && (
          <View style={[styles.dateTimeRow, { marginTop: 6, justifyContent: 'flex-end' }]}>
            <Icon name="check-circle-outline" size={12} color="#1E8C45" />
            <Text style={[styles.dateText, { color: '#1E8C45' }]}>
              Completed {fmtDate(item.completedAt)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  )
}

/* ═══════════════════════════════════════════════════ */
/*  Main Screen                                        */
/* ═══════════════════════════════════════════════════ */
export default function RefundsScreen() {
  const navigation = useNavigation()

  const [refunds, setRefunds]           = useState([])
  const [loading, setLoading]           = useState(false)
  const [refreshing, setRefreshing]     = useState(false)
  const [page, setPage]                 = useState(1)
  const [hasMore, setHasMore]           = useState(true)
  const [total, setTotal]               = useState(0)
  const [selectedFilter, setSelectedFilter] = useState('all')

  const listAnim   = useRef(new Animated.Value(0)).current
  const headerAnim = useRef(new Animated.Value(0)).current

  useState(() => {
    Animated.timing(headerAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start()
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchRefunds(1, true)
    }, [selectedFilter])
  )

  const fetchRefunds = async (pageNumber = 1, reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        listAnim.setValue(0)
      }

      const token      = await AsyncStorage.getItem('userToken')
      const businessId = await AsyncStorage.getItem('businessId')

      let url = `${BASE_URL}/customer/business/${businessId}/refunds?page=${pageNumber}&limit=10`
      if (selectedFilter !== 'all') url += `&status=${selectedFilter}`

      const res  = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      const json = await res.json()

      const newData    = json?.data?.refunds || []
      const totalCount = json?.data?.total   || 0

      if (reset) {
        setRefunds(newData)
        setTotal(totalCount)
      } else {
        setRefunds(prev => [...prev, ...newData])
      }

      setHasMore(newData.length === 10)
      setPage(pageNumber)

      Animated.timing(listAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start()
    } catch (e) {
      console.log('Refunds fetch error', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadMore = () => {
    if (hasMore && !loading && !refreshing) fetchRefunds(page + 1)
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchRefunds(1, true)
  }

  const onFilterChange = key => {
    setSelectedFilter(key)
    setPage(1)
    setRefunds([])
  }

  const renderFooter = () => {
    if (!hasMore || refunds.length === 0) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={BLUE} />
        <Text style={styles.footerText}>Loading more…</Text>
      </View>
    )
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Icon name="cash-refund" size={48} color={BLUE_MID} />
      </View>
      <Text style={styles.emptyTitle}>No refunds yet</Text>
      <Text style={styles.emptySubtitle}>
        Any refunds raised against your orders will appear here.
      </Text>
    </View>
  )

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={BLUE_DARK} />

      {/* ── Header ── */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [{
              translateY: headerAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }),
            }],
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.75}>
            <Icon name="arrow-left" size={20} color={WHITE} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerEyebrow}>Returns & Refunds</Text>
            <Text style={styles.headerTitle}>My Refunds</Text>
          </View>
        </View>

        {total > 0 && (
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{total}</Text>
          </View>
        )}
      </Animated.View>

      {/* ── Filter bar ── */}
      <View style={styles.filterBar}>
        {FILTERS.map(f => {
          const isActive = selectedFilter === f.key
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => onFilterChange(f.key)}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              activeOpacity={0.8}
            >
              <Icon name={f.icon} size={14} color={isActive ? WHITE : TEXT_LIGHT} />
              <Text style={[styles.filterTabLabel, isActive && styles.filterTabLabelActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Count row ── */}
      {!loading && refunds.length > 0 && (
        <View style={styles.countRow}>
          <Text style={styles.countText}>{total} refund{total !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* ── List ── */}
      {loading && refunds.length === 0 ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={styles.loadingText}>Fetching refunds…</Text>
        </View>
      ) : (
        <FlatList
          data={refunds}
          keyExtractor={item => item.refundId}
          renderItem={({ item }) => <RefundCard item={item} listAnim={listAnim} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BLUE]} tintColor={BLUE} />
          }
        />
      )}
    </View>
  )
}

/* ═══════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 52,
    paddingBottom: 14,
    backgroundColor: BLUE,
    shadowColor: BLUE_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  headerLeft:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center', alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 10, color: 'rgba(255,255,255,0.65)',
    fontFamily: FONTS.Medium, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20, fontFamily: FONTS.Bold, color: WHITE, letterSpacing: -0.3, lineHeight: 24,
  },
  totalBadge: {
    backgroundColor: WHITE, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
  },
  totalBadgeText: { fontSize: 13, fontFamily: FONTS.Bold, color: BLUE },

  /* Filter bar */
  filterBar: {
    flexDirection: 'row',
    backgroundColor: WHITE,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
    borderBottomWidth: 1, borderBottomColor: BORDER,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 2,
  },
  filterTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 8,
    borderRadius: 10, gap: 5,
    backgroundColor: BG, borderWidth: 1, borderColor: BORDER,
  },
  filterTabActive: {
    backgroundColor: BLUE, borderColor: BLUE,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  filterTabLabel:       { fontSize: 11, fontFamily: FONTS.Medium, color: TEXT_LIGHT },
  filterTabLabelActive: { color: WHITE, fontFamily: FONTS.Bold },

  /* Count */
  countRow: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 2 },
  countText: {
    fontSize: 11, fontFamily: FONTS.Medium, color: TEXT_LIGHT,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },

  /* List */
  list: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 32 },

  /* Card */
  card: {
    backgroundColor: WHITE, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: BORDER,
    shadowColor: BLUE, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTop:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  typeIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: BORDER, flexShrink: 0,
  },
  cardTopMid:  { flex: 1 },
  amountText:  { fontSize: 20, fontFamily: FONTS.Bold, color: TEXT_DARK, letterSpacing: -0.5 },
  providerRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  providerText:{ fontSize: 11, fontFamily: FONTS.Medium, color: TEXT_LIGHT, textTransform: 'capitalize' },
  dot:         { fontSize: 11, color: TEXT_LIGHT },

  /* Status badge */
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 9, paddingVertical: 5,
    borderRadius: 8, gap: 4, flexShrink: 0,
  },
  statusText: { fontSize: 11, fontFamily: FONTS.Bold },

  /* Progress */
  progressSection: { marginTop: 14 },
  progressLabels: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6,
  },
  progressLabel:  { fontSize: 11, fontFamily: FONTS.Medium, color: TEXT_LIGHT },
  progressValue:  { fontSize: 12, fontFamily: FONTS.Bold, color: TEXT_DARK },
  fullRefundBadge:{ color: '#1E8C45', fontSize: 10, fontFamily: FONTS.Bold },
  progressBar:    {
    height: 5, backgroundColor: BORDER, borderRadius: 4, overflow: 'hidden',
  },
  progressFill:   { height: '100%', borderRadius: 4 },

  divider: { height: 1, backgroundColor: BORDER, marginVertical: 12 },

  /* Items */
  itemsPreview: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  itemsText:    { fontSize: 12, fontFamily: FONTS.Medium, color: TEXT_MID, flex: 1 },
  itemsExtra:   { color: BLUE, fontFamily: FONTS.Bold },

  /* Ref / reason rows */
  refRow:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  refText:   { fontSize: 11, fontFamily: FONTS.Regular, color: TEXT_LIGHT, flex: 1 },
  reasonRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  reasonText:{ fontSize: 11, fontFamily: FONTS.Regular, color: TEXT_MID, flex: 1 },

  /* Card bottom */
  cardBottom:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBottomLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  orderIdText:    { fontSize: 11, fontFamily: FONTS.Regular, color: TEXT_LIGHT },
  dateTimeRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText:       { fontSize: 11, fontFamily: FONTS.Regular, color: TEXT_LIGHT },

  /* Footer */
  footerLoader: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 8, paddingVertical: 16,
  },
  footerText: { fontSize: 12, fontFamily: FONTS.Medium, color: TEXT_LIGHT },

  /* Empty */
  emptyContainer: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 40 },
  emptyIconWrap: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: BLUE_LIGHT, justifyContent: 'center', alignItems: 'center',
    marginBottom: 20, borderWidth: 1, borderColor: BLUE_MID,
  },
  emptyTitle:    { fontSize: 18, fontFamily: FONTS.Bold, color: TEXT_DARK, marginBottom: 8 },
  emptySubtitle: {
    fontSize: 13, fontFamily: FONTS.Regular, color: TEXT_MID, textAlign: 'center', lineHeight: 20,
  },

  /* Loader */
  loader:      { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, fontFamily: FONTS.Medium, color: TEXT_MID, letterSpacing: 0.3 },
})